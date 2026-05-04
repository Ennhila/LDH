import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  getPackageSummaryLines,
  readShippingDraftFromWindow,
} from '../../lib/shipping-wizard/draft';
import { readDestinatarioDraft } from '../../lib/shipping-wizard/destinatario-storage';
import { formatOficinaDireccion, formatOficinaLabel } from '../../lib/shipping-wizard/mock-oficinas';
import { readRemitenteDraft } from '../../lib/shipping-wizard/remitente-storage';
import { redirectIfSelectedDeliveryTypeInactive } from '../../lib/shipping-wizard/selected-delivery-guard';
import { getShippingOptionById } from '../../lib/shipping-wizard/shippingOptions';
import { getToken } from '../../lib/api';
import type { PaymentMethodId } from '../../lib/pdf/order-snapshot';
import {
  buildOrderSnapshotFromWizard,
  persistCompletedOrderSnapshot,
} from '../../lib/pdf/order-snapshot';
import { submitClientEnvioFromWizard } from '../../lib/shipping-wizard/submit-envio-api';
import type { ShippingDraft } from '../../lib/shipping-wizard/types';
import { CheckoutAuthModal } from './CheckoutAuthModal';
import { SectionEditDropdown } from './SectionEditDropdown';
import { SummarySidebar } from './SummarySidebar';
import { WizardLoginStrip } from './WizardLoginStrip';
import { WizardPageHeader } from './WizardPageHeader';

const SELECTED_OPTION_KEY = 'ldh_shipping_selected_option_id';

export function ShippingStepFourPage() {
  const [draft, setDraft] = useState<ShippingDraft>(() => readShippingDraftFromWindow());
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [payment, setPayment] = useState<PaymentMethodId>('gratis');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    setDraft(readShippingDraftFromWindow());
    try {
      const raw = sessionStorage.getItem(SELECTED_OPTION_KEY);
      const id = raw ? Number(raw) : NaN;
      setSelectedId(Number.isFinite(id) ? id : null);
    } catch {
      setSelectedId(null);
    }
  }, []);

  useEffect(() => {
    void redirectIfSelectedDeliveryTypeInactive();
  }, []);

  const selectedOption = useMemo(
    () => (selectedId != null ? getShippingOptionById(selectedId) : undefined),
    [selectedId],
  );

  const remitente = readRemitenteDraft();
  const destinatario = readDestinatarioDraft();

  const { weight, size } = getPackageSummaryLines(draft.packageTier);

  const listPrice = selectedOption?.price ?? 0;
  const chargedTotal = payment === 'gratis' ? 0 : listPrice;
  const pricing = { subtotal: chargedTotal, total: chargedTotal };

  const remitenteNombre = `${remitente.nombre} ${remitente.primerApellido} ${remitente.segundoApellido}`.trim();
  const deposito =
    selectedOption?.pickup === 'Oficina' ? 'Recogida en oficina' : 'Recogida a domicilio';

  const destNombre = `${destinatario.nombre} ${destinatario.primerApellido} ${destinatario.segundoApellido}`.trim();
  const entregaTipo = selectedOption?.delivery === 'Oficina' ? 'Oficina' : 'Domicilio';
  const entregaDireccion =
    selectedOption?.delivery === 'Oficina' && destinatario.oficinaSeleccionada
      ? `${formatOficinaLabel(destinatario.oficinaSeleccionada)} — ${formatOficinaDireccion(destinatario.oficinaSeleccionada)}`
      : `${destinatario.direccion}, ${destinatario.codigoPostal} ${destinatario.localidad} (${destinatario.provincia})`;

  const canBuy = acceptTerms && selectedOption != null;

  const completeCheckout = async () => {
    const opt = selectedOption;
    if (!opt) return;

    const draftNow = readShippingDraftFromWindow();
    const remitenteNow = readRemitenteDraft();
    const destinatarioNow = readDestinatarioDraft();

    setSubmitting(true);
    try {
      let tracking: string;
      try {
        const envio = await submitClientEnvioFromWizard(draftNow, remitenteNow, destinatarioNow, opt, payment);
        tracking = envio.trackingNumber;
        sessionStorage.setItem('ldh_order_persisted_api', '1');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'No se pudo registrar el envío';
        window.alert(msg);
        return;
      }

      try {
        sessionStorage.setItem(SELECTED_OPTION_KEY, String(opt.id));
      } catch {
        /* ignore */
      }
      const snap = buildOrderSnapshotFromWizard(payment, tracking, opt);
      if (!snap) {
        window.alert('No se pudo generar el pedido. Vuelve al paso 1.');
        return;
      }
      persistCompletedOrderSnapshot(snap);
      const t = encodeURIComponent(snap.trackingNumber);
      window.location.assign(`/envio/exito?t=${t}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleComprar = async () => {
    if (!canBuy || submitting) return;
    if (!selectedOption) return;

    if (!getToken()) {
      setAuthModalOpen(true);
      return;
    }

    await completeCheckout();
  };

  const handleAuthSuccess = async () => {
    setAuthModalOpen(false);
    await completeCheckout();
  };

  return (
    <div className="flex-1 bg-slate-50">
      <CheckoutAuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
      <WizardPageHeader currentStep={4} subtitle={null} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_340px]">
          <div className="order-2 min-w-0 space-y-6 lg:order-1">
            {selectedId == null || !selectedOption ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900">
                <p className="font-semibold">Falta completar el flujo del envío.</p>
                <a href="/envio/paso-1" className="mt-2 inline-block font-bold text-ldh-orange underline">
                  Ir al paso 1
                </a>
              </div>
            ) : (
              <>
                <SummaryBlock
                  title="Remitente"
                  editItems={[{ label: 'Editar remitente', href: '/envio/paso-2' }]}
                >
                  <p className="font-semibold text-slate-900">{remitenteNombre}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {remitente.prefijo} {remitente.telefono}
                  </p>
                  <p className="mt-3 text-sm text-slate-700">
                    <span className="font-semibold">Depósito:</span> {deposito}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    <span className="font-semibold">Etiqueta:</span> Imprime LDH / oficina
                  </p>
                </SummaryBlock>

                <SummaryBlock
                  title="Destinatario"
                  editItems={[{ label: 'Editar destinatario', href: '/envio/paso-3' }]}
                >
                  <p className="font-semibold text-slate-900">{destNombre}</p>
                  <p className="mt-1 text-sm text-slate-600">{destinatario.email}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {destinatario.prefijo} {destinatario.telefono}
                  </p>
                  <p className="mt-3 text-sm text-slate-700">
                    <span className="font-semibold">Entrega:</span> {entregaTipo}
                  </p>
                  <p className="mt-1 text-sm uppercase text-slate-600">{entregaDireccion}</p>
                </SummaryBlock>

                <SummaryBlock
                  title="Tamaño"
                  editItems={[{ label: 'Editar producto y tamaño', href: '/envio/paso-1' }]}
                >
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold">Tipo de producto:</span> {selectedOption.title}
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
                    <span className="font-semibold">Tamaño:</span> Peso {weight} · {size}
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
                    <span className="font-semibold">Extras:</span> —
                  </p>
                </SummaryBlock>

                <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
                  <h2 className="text-lg font-extrabold text-slate-900">Método de pago y facturación</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Selecciona un método de pago para estos envíos.
                  </p>

                  <fieldset className="mt-6 space-y-4">
                    <legend className="sr-only">Método de pago</legend>

                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 has-checked:border-ldh-orange has-checked:bg-orange-50/50">
                      <input
                        type="radio"
                        name="pago"
                        checked={payment === 'gratis'}
                        onChange={() => setPayment('gratis')}
                        className="h-4 w-4 accent-ldh-orange"
                      />
                      <span className="text-sm font-semibold text-slate-800">
                        Sin cargo (pruebas) — omitir pago por ahora
                      </span>
                    </label>

                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 has-checked:border-ldh-orange has-checked:bg-orange-50/50">
                      <input
                        type="radio"
                        name="pago"
                        checked={payment === 'bizum'}
                        onChange={() => setPayment('bizum')}
                        className="h-4 w-4 accent-ldh-orange"
                      />
                      <span className="text-sm font-semibold text-slate-800">Bizum</span>
                    </label>

                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 has-checked:border-ldh-orange has-checked:bg-orange-50/50">
                      <input
                        type="radio"
                        name="pago"
                        checked={payment === 'paypal'}
                        onChange={() => setPayment('paypal')}
                        className="h-4 w-4 accent-ldh-orange"
                      />
                      <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        PayPal
                        <img src="/images/paypal.svg" alt="" className="h-5 w-auto" />
                      </span>
                    </label>

                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 has-checked:border-ldh-orange has-checked:bg-orange-50/50">
                      <input
                        type="radio"
                        name="pago"
                        checked={payment === 'tarjeta'}
                        onChange={() => setPayment('tarjeta')}
                        className="h-4 w-4 accent-ldh-orange"
                      />
                      <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-800">
                        Tarjeta
                        <img src="/images/visa.svg" alt="Visa" className="h-4 w-auto" />
                        <img src="/images/maestro.svg" alt="Maestro" className="h-4 w-auto" />
                      </span>
                    </label>
                  </fieldset>

                  <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/80 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="mt-1 h-4 w-4 shrink-0 accent-ldh-orange"
                    />
                    <span className="text-sm text-slate-700">
                      Acepto las <strong>condiciones del servicio</strong> y la política de privacidad
                      (demo).
                    </span>
                  </label>
                </section>
              </>
            )}

            <WizardLoginStrip />
          </div>

          <div className="order-1 lg:order-2">
            <SummarySidebar
              draft={draft}
              productTitle={selectedOption?.title ?? null}
              pricing={selectedOption ? pricing : null}
              continueLabel={submitting ? 'Procesando…' : 'Comprar ahora'}
              onContinue={handleComprar}
              continueDisabled={!canBuy || submitting}
              ctaVariant="navy"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryBlock({
  title,
  children,
  editItems,
}: {
  title: string;
  children: ReactNode;
  editItems: { label: string; href: string }[];
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <h2 className="text-base font-extrabold text-slate-900">{title}</h2>
        <SectionEditDropdown items={editItems} />
      </div>
      <div className="pt-4">{children}</div>
    </section>
  );
}
