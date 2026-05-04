import { useEffect, useMemo, useState } from 'react';
import { readShippingDraftFromWindow } from '../../lib/shipping-wizard/draft';
import { persistDestinatarioDraft, readDestinatarioDraft } from '../../lib/shipping-wizard/destinatario-storage';
import { redirectIfSelectedDeliveryTypeInactive } from '../../lib/shipping-wizard/selected-delivery-guard';
import { getShippingOptionById } from '../../lib/shipping-wizard/shippingOptions';
import { LOCALIDADES_BY_PROVINCIA, PROVINCIAS_ES } from '../../lib/shipping-wizard/spain-geo-mock';
import type { DestinatarioDraft, ShippingDraft } from '../../lib/shipping-wizard/types';
import {
  emailErrorMessage,
  isSpainPostalCode,
  PAIS_TO_PREFIX,
  validateWizardPostal,
  WIZARD_PAISES,
  wizardPhoneError,
} from '../../lib/validation/inputs';
import { DestinatarioOfficeSection } from './DestinatarioOfficeSection';
import { SummarySidebar } from './SummarySidebar';
import { WizardLoginStrip } from './WizardLoginStrip';
import { WizardPageHeader } from './WizardPageHeader';

const SELECTED_OPTION_KEY = 'ldh_shipping_selected_option_id';

const inp =
  'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-ldh-orange focus:ring-2 focus:ring-ldh-orange/25 focus:outline-none';

export function ShippingStepThreePage() {
  const [draft, setDraft] = useState<ShippingDraft>(() => readShippingDraftFromWindow());
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<DestinatarioDraft>(() => readDestinatarioDraft());

  useEffect(() => {
    const d = readShippingDraftFromWindow();
    setDraft(d);
    try {
      const raw = sessionStorage.getItem(SELECTED_OPTION_KEY);
      const id = raw ? Number(raw) : NaN;
      setSelectedId(Number.isFinite(id) ? id : null);
    } catch {
      setSelectedId(null);
    }
    const saved = readDestinatarioDraft();
    const destCp = d.destinationPostalCode?.trim() || '';
    setForm({
      ...saved,
      busquedaCpOficina: saved.busquedaCpOficina || destCp,
      codigoPostal: saved.codigoPostal || destCp,
    });
  }, []);

  useEffect(() => {
    void redirectIfSelectedDeliveryTypeInactive();
  }, []);

  const selectedOption = useMemo(
    () => (selectedId != null ? getShippingOptionById(selectedId) : undefined),
    [selectedId],
  );

  const entregaOficina = selectedOption?.delivery === 'Oficina';

  useEffect(() => {
    if (!entregaOficina) return;
    setForm((prev) =>
      prev.pais === 'España' ? prev : { ...prev, pais: 'España', prefijo: '+34' },
    );
  }, [entregaOficina]);

  const pricing =
    selectedOption != null
      ? { subtotal: selectedOption.price, total: selectedOption.price }
      : null;

  const isSpainDest = form.pais === 'España';

  const localidades = useMemo(() => {
    if (!isSpainDest) return [];
    const list = LOCALIDADES_BY_PROVINCIA[form.provincia];
    return list ?? [];
  }, [form.provincia, isSpainDest]);

  const destCpCheck = useMemo(
    () => validateWizardPostal(form.pais, form.codigoPostal),
    [form.pais, form.codigoPostal],
  );
  const emailErr = useMemo(() => emailErrorMessage(form.email), [form.email]);
  const phoneErr = useMemo(
    () => wizardPhoneError(form.prefijo, form.telefono),
    [form.prefijo, form.telefono],
  );
  const oficinaCpErr = useMemo(() => {
    if (!entregaOficina) return null;
    const t = form.busquedaCpOficina.trim();
    if (!t) return 'Indica un código postal para buscar oficinas.';
    if (!isSpainPostalCode(t)) {
      return 'Código postal español no válido para búsqueda de oficina (provincias 01–52 o 35/38).';
    }
    return null;
  }, [entregaOficina, form.busquedaCpOficina]);

  const update = <K extends keyof DestinatarioDraft>(key: K, value: DestinatarioDraft[K]) => {
    setForm((prev) => {
      let next: DestinatarioDraft = { ...prev, [key]: value };
      if (key === 'pais') {
        const prefix = PAIS_TO_PREFIX[value as string] ?? '+34';
        next = { ...next, prefijo: prefix };
        if (value !== 'España') {
          next = { ...next, provincia: '', localidad: '' };
        }
      }
      if (key === 'provincia' && next.pais === 'España') {
        const locs = LOCALIDADES_BY_PROVINCIA[value as string];
        if (locs && !locs.includes(next.localidad)) next = { ...next, localidad: '' };
      }
      return next;
    });
  };

  const canSubmit = (() => {
    const baseFields =
      form.nombre.trim() &&
      form.primerApellido.trim() &&
      form.email.trim() &&
      form.telefono.trim();
    if (!baseFields || emailErr !== null || phoneErr !== null) return false;
    if (entregaOficina) {
      return form.oficinaSeleccionada != null && oficinaCpErr === null;
    }
    const geoOk = form.localidad.trim().length > 0 && form.provincia.trim().length > 0;
    return (
      form.direccion.trim() &&
      form.codigoPostal.trim() &&
      geoOk &&
      destCpCheck.ok
    );
  })();

  const goToNextStep = () => {
    if (!canSubmit || selectedId == null) return;
    persistDestinatarioDraft(form);
    console.log('[LDH] Destinatario guardado (mock):', form);
    window.location.assign('/envio/paso-4');
  };

  return (
    <div className="flex-1 bg-slate-50">
      <WizardPageHeader currentStep={3} subtitle={null} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_340px]">
          <div className="order-2 min-w-0 space-y-6 lg:order-1">
            {selectedId == null ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900">
                <p className="font-semibold">Falta el contexto del envío.</p>
                <a href="/envio/paso-1" className="mt-2 inline-block font-bold text-ldh-orange underline">
                  Volver al paso 1
                </a>
              </div>
            ) : (
              <>
                <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
                  <h2 className="text-lg font-extrabold text-slate-900">Datos personales</h2>
                  <p className="mt-1 text-sm text-slate-500">Introduce los datos necesarios</p>

                  <fieldset className="mt-6 flex flex-wrap gap-4">
                    <legend className="sr-only">Tipo de destinatario</legend>
                    {(
                      [
                        { id: 'particular' as const, label: 'Particular' },
                        { id: 'empresa' as const, label: 'Empresa' },
                      ] as const
                    ).map(({ id, label }) => (
                      <label
                        key={id}
                        className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-3 text-sm font-bold ${
                          form.tipo === id
                            ? 'border-ldh-orange bg-orange-50 text-ldh-orange'
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="tipo-dest"
                          checked={form.tipo === id}
                          onChange={() => update('tipo', id)}
                          className="h-4 w-4 border-slate-300 text-ldh-orange accent-ldh-orange"
                        />
                        {label}
                      </label>
                    ))}
                  </fieldset>

                  <div className="mt-6 space-y-4">
                    <input
                      className={inp}
                      placeholder="Nombre *"
                      value={form.nombre}
                      onChange={(e) => update('nombre', e.target.value)}
                      required
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <input
                        className={inp}
                        placeholder="Primer apellido *"
                        value={form.primerApellido}
                        onChange={(e) => update('primerApellido', e.target.value)}
                        required
                      />
                      <input
                        className={inp}
                        placeholder="Segundo apellido"
                        value={form.segundoApellido}
                        onChange={(e) => update('segundoApellido', e.target.value)}
                      />
                    </div>
                  </div>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
                  <h2 className="text-lg font-extrabold text-slate-900">¿Dónde vas a enviarlo?</h2>
                  <div className="mt-6">
                    {entregaOficina ? (
                      <>
                        <p className="text-sm text-slate-600">
                          Las oficinas LDH están en España: el código postal de búsqueda debe ser un CP español válido.
                        </p>
                        <DestinatarioOfficeSection
                          busquedaCp={form.busquedaCpOficina}
                          onBusquedaCpChange={(v) =>
                            setForm((prev) => ({
                              ...prev,
                              busquedaCpOficina: v,
                              oficinaSeleccionada: null,
                            }))
                          }
                          seleccionada={form.oficinaSeleccionada}
                          onSeleccionar={(o) => update('oficinaSeleccionada', o)}
                          onQuitarSeleccion={() => update('oficinaSeleccionada', null)}
                        />
                        {oficinaCpErr ? (
                          <p className="text-sm text-red-600" role="alert">
                            {oficinaCpErr}
                          </p>
                        ) : null}
                      </>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-slate-600">
                          Introduce la dirección de entrega a domicilio.
                        </p>
                        <input
                          className={inp}
                          placeholder="Dirección *"
                          value={form.direccion}
                          onChange={(e) => update('direccion', e.target.value)}
                          required
                        />
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <input
                              className={`${inp} ${!destCpCheck.ok && form.codigoPostal.trim() ? 'border-red-300' : ''}`}
                              placeholder="Código postal *"
                              inputMode={form.pais === 'España' ? 'numeric' : 'text'}
                              value={form.codigoPostal}
                              onChange={(e) => update('codigoPostal', e.target.value)}
                              required
                            />
                            {!destCpCheck.ok && form.codigoPostal.trim() ? (
                              <p className="mt-1 text-xs text-red-600">{destCpCheck.message}</p>
                            ) : null}
                          </div>
                          <select
                            className={inp}
                            value={form.pais}
                            onChange={(e) => update('pais', e.target.value)}
                            aria-label="País de entrega"
                          >
                            {WIZARD_PAISES.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            {isSpainDest && localidades.length > 0 ? (
                              <select
                                className={inp}
                                value={form.localidad}
                                onChange={(e) => update('localidad', e.target.value)}
                                required
                              >
                                <option value="">Localidad *</option>
                                {localidades.map((l) => (
                                  <option key={l} value={l}>
                                    {l}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                className={inp}
                                placeholder="Localidad *"
                                value={form.localidad}
                                onChange={(e) => update('localidad', e.target.value)}
                                required
                              />
                            )}
                          </div>
                          {isSpainDest ? (
                            <select
                              className={inp}
                              value={form.provincia}
                              onChange={(e) => update('provincia', e.target.value)}
                              required
                            >
                              <option value="">Provincia *</option>
                              {PROVINCIAS_ES.map((p) => (
                                <option key={p} value={p}>
                                  {p}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              className={inp}
                              placeholder="Provincia / región *"
                              value={form.provincia}
                              onChange={(e) => update('provincia', e.target.value)}
                              required
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
                  <h2 className="text-lg font-extrabold text-slate-900">Datos de contacto</h2>
                  <p className="mt-1 text-sm text-slate-500">Te avisaremos sobre el envío</p>
                  <div className="mt-6 space-y-4">
                    <div>
                      <input
                        type="email"
                        className={`${inp} ${emailErr ? 'border-red-300' : ''}`}
                        placeholder="Email *"
                        value={form.email}
                        onChange={(e) => update('email', e.target.value)}
                        required
                      />
                      {emailErr ? <p className="mt-1 text-xs text-red-600">{emailErr}</p> : null}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <select
                        className={inp}
                        value={form.prefijo}
                        onChange={(e) => update('prefijo', e.target.value)}
                      >
                        <option value="+34">+34 — España</option>
                        <option value="+351">+351 — Portugal</option>
                        <option value="+33">+33 — Francia</option>
                        <option value="+39">+39 — Italia</option>
                        <option value="+49">+49 — Alemania</option>
                      </select>
                      <div>
                        <input
                          type="tel"
                          className={`${inp} ${phoneErr ? 'border-red-300' : ''}`}
                          placeholder="Teléfono *"
                          inputMode="tel"
                          value={form.telefono}
                          onChange={(e) => update('telefono', e.target.value)}
                          required
                        />
                        {phoneErr ? <p className="mt-1 text-xs text-red-600">{phoneErr}</p> : null}
                      </div>
                    </div>
                  </div>
                </section>

                <div>
                  <button
                    type="button"
                    disabled={!canSubmit}
                    onClick={goToNextStep}
                    className={`rounded-lg px-8 py-3 text-sm font-bold tracking-wide uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                      canSubmit
                        ? 'bg-ldh-orange text-white hover:bg-ldh-orange-hover'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    Continuar
                  </button>
                </div>
              </>
            )}

            <WizardLoginStrip />
          </div>

          <div className="order-1 lg:order-2">
            <SummarySidebar
              draft={draft}
              productTitle={selectedOption?.title ?? null}
              pricing={pricing}
              onContinue={goToNextStep}
              continueDisabled={!canSubmit || selectedId == null}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
