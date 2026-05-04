import { useEffect, useMemo, useState } from 'react';
import { readShippingDraftFromWindow } from '../../lib/shipping-wizard/draft';
import { redirectIfSelectedDeliveryTypeInactive } from '../../lib/shipping-wizard/selected-delivery-guard';
import { getShippingOptionById } from '../../lib/shipping-wizard/shippingOptions';
import { persistRemitenteDraft, readRemitenteDraft } from '../../lib/shipping-wizard/remitente-storage';
import { LOCALIDADES_BY_PROVINCIA, PROVINCIAS_ES } from '../../lib/shipping-wizard/spain-geo-mock';
import type { RemitenteDraft, ShippingDraft } from '../../lib/shipping-wizard/types';
import {
  emailErrorMessage,
  PAIS_TO_PREFIX,
  validateWizardPostal,
  WIZARD_PAISES,
  wizardPhoneError,
} from '../../lib/validation/inputs';
import { SummarySidebar } from './SummarySidebar';
import { WizardLoginStrip } from './WizardLoginStrip';
import { WizardPageHeader } from './WizardPageHeader';

const SELECTED_OPTION_KEY = 'ldh_shipping_selected_option_id';

const field =
  'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-ldh-orange focus:ring-2 focus:ring-ldh-orange/25 focus:outline-none';
const labelCls = 'mb-1.5 block text-xs font-semibold text-slate-700';

export function ShippingStepTwoPage() {
  const [draft, setDraft] = useState<ShippingDraft>(() => readShippingDraftFromWindow());
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<RemitenteDraft>(() => readRemitenteDraft());

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
    const r = readRemitenteDraft();
    if (!r.codigoPostal && d.originPostalCode) {
      setForm({ ...r, codigoPostal: d.originPostalCode });
    } else {
      setForm(r);
    }
  }, []);

  useEffect(() => {
    void redirectIfSelectedDeliveryTypeInactive();
  }, []);

  const selectedOption = useMemo(
    () => (selectedId != null ? getShippingOptionById(selectedId) : undefined),
    [selectedId],
  );

  const isSpain = form.pais === 'España';

  const localidades = useMemo(() => {
    if (!isSpain) return [];
    const list = LOCALIDADES_BY_PROVINCIA[form.provincia];
    return list ?? [];
  }, [form.provincia, isSpain]);

  const cpCheck = useMemo(
    () => validateWizardPostal(form.pais, form.codigoPostal),
    [form.pais, form.codigoPostal],
  );
  const emailErr = useMemo(() => emailErrorMessage(form.email), [form.email]);
  const phoneErr = useMemo(
    () => wizardPhoneError(form.prefijo, form.telefono),
    [form.prefijo, form.telefono],
  );

  const pricing =
    selectedOption != null
      ? { subtotal: selectedOption.price, total: selectedOption.price }
      : null;

  const update = <K extends keyof RemitenteDraft>(key: K, value: RemitenteDraft[K]) => {
    setForm((prev) => {
      let next: RemitenteDraft = { ...prev, [key]: value };
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

  const goToNextStep = () => {
    if (!canSubmit || selectedId == null) return;
    persistRemitenteDraft(form);
    console.log('[LDH] Remitente guardado (mock):', form);
    window.location.assign('/envio/paso-3');
  };

  const geoOk = form.provincia.trim().length > 0 && form.localidad.trim().length > 0;

  const canSubmit =
    form.nombre.trim() &&
    form.primerApellido.trim() &&
    form.direccion.trim() &&
    form.codigoPostal.trim() &&
    form.email.trim() &&
    form.telefono.trim() &&
    geoOk &&
    cpCheck.ok &&
    emailErr === null &&
    phoneErr === null;

  if (selectedId == null && typeof window !== 'undefined') {
    /* opción no elegida: redirigir a paso 1 */
  }

  return (
    <div className="flex-1 bg-slate-50">
      <WizardPageHeader currentStep={2} subtitle={null} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_340px]">
          <div className="order-2 min-w-0 lg:order-1">
            {selectedId == null ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900">
                <p className="font-semibold">Falta elegir un servicio.</p>
                <a href="/envio/paso-1" className="mt-2 inline-block font-bold text-ldh-orange underline">
                  Volver al paso 1
                </a>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  goToNextStep();
                }}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-md sm:p-8"
              >
                <h2 className="text-xl font-extrabold text-slate-800">¿Quién lo envía?</h2>

                <fieldset className="mt-6 flex flex-wrap gap-4">
                  <legend className="sr-only">Tipo de remitente</legend>
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
                        name="tipo"
                        checked={form.tipo === id}
                        onChange={() => update('tipo', id)}
                        className="h-4 w-4 border-slate-300 text-ldh-orange accent-ldh-orange"
                      />
                      {label}
                    </label>
                  ))}
                </fieldset>

                <div className="mt-8 space-y-6">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 uppercase">Datos personales</h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className={labelCls} htmlFor="nombre">
                          Nombre<span className="text-ldh-orange">*</span>
                        </label>
                        <input
                          id="nombre"
                          className={field}
                          value={form.nombre}
                          onChange={(e) => update('nombre', e.target.value)}
                          required
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className={labelCls} htmlFor="ap1">
                            Primer apellido<span className="text-ldh-orange">*</span>
                          </label>
                          <input
                            id="ap1"
                            className={field}
                            value={form.primerApellido}
                            onChange={(e) => update('primerApellido', e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label className={labelCls} htmlFor="ap2">
                            Segundo apellido
                          </label>
                          <input
                            id="ap2"
                            className={field}
                            value={form.segundoApellido}
                            onChange={(e) => update('segundoApellido', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 uppercase">Dirección</h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className={labelCls} htmlFor="dir">
                          Dirección<span className="text-ldh-orange">*</span>
                        </label>
                        <input
                          id="dir"
                          className={field}
                          value={form.direccion}
                          onChange={(e) => update('direccion', e.target.value)}
                          required
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className={labelCls} htmlFor="cp">
                            Código postal<span className="text-ldh-orange">*</span>
                          </label>
                          <input
                            id="cp"
                            className={`${field} ${!cpCheck.ok && form.codigoPostal.trim() ? 'border-red-300' : ''}`}
                            inputMode={form.pais === 'España' ? 'numeric' : 'text'}
                            value={form.codigoPostal}
                            onChange={(e) => update('codigoPostal', e.target.value)}
                            required
                          />
                          {!cpCheck.ok && form.codigoPostal.trim() ? (
                            <p className="mt-1 text-xs text-red-600">{cpCheck.message}</p>
                          ) : null}
                        </div>
                        <div>
                          <label className={labelCls} htmlFor="pais-rem">
                            País<span className="text-ldh-orange">*</span>
                          </label>
                          <select
                            id="pais-rem"
                            className={field}
                            value={form.pais}
                            onChange={(e) => update('pais', e.target.value)}
                            required
                          >
                            {WIZARD_PAISES.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className={labelCls} htmlFor="loc">
                            Localidad<span className="text-ldh-orange">*</span>
                          </label>
                          {isSpain && localidades.length > 0 ? (
                            <select
                              id="localidad-select"
                              className={field}
                              value={form.localidad}
                              onChange={(e) => update('localidad', e.target.value)}
                              required
                            >
                              <option value="">Selecciona…</option>
                              {localidades.map((l) => (
                                <option key={l} value={l}>
                                  {l}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              id="localidad-input"
                              className={field}
                              value={form.localidad}
                              onChange={(e) => update('localidad', e.target.value)}
                              placeholder="Localidad"
                              required
                            />
                          )}
                        </div>
                        <div>
                          <label className={labelCls} htmlFor="prov">
                            {isSpain ? 'Provincia' : 'Provincia / región'}
                            <span className="text-ldh-orange">*</span>
                          </label>
                          {isSpain ? (
                            <select
                              id="prov"
                              className={field}
                              value={form.provincia}
                              onChange={(e) => update('provincia', e.target.value)}
                              required
                            >
                              <option value="">Selecciona…</option>
                              {PROVINCIAS_ES.map((p) => (
                                <option key={p} value={p}>
                                  {p}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              id="prov"
                              className={field}
                              value={form.provincia}
                              onChange={(e) => update('provincia', e.target.value)}
                              placeholder="Ej. Norte, distrito…"
                              required
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 uppercase">Datos de contacto</h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className={labelCls} htmlFor="email">
                          Email<span className="text-ldh-orange">*</span>
                        </label>
                        <input
                          id="email"
                          type="email"
                          className={`${field} ${emailErr ? 'border-red-300' : ''}`}
                          value={form.email}
                          onChange={(e) => update('email', e.target.value)}
                          required
                        />
                        {emailErr ? <p className="mt-1 text-xs text-red-600">{emailErr}</p> : null}
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className={labelCls} htmlFor="pref">
                            Prefijo
                          </label>
                          <select
                            id="pref"
                            className={field}
                            value={form.prefijo}
                            onChange={(e) => update('prefijo', e.target.value)}
                          >
                            <option value="+34">+34 — España</option>
                            <option value="+351">+351 — Portugal</option>
                            <option value="+33">+33 — Francia</option>
                            <option value="+39">+39 — Italia</option>
                            <option value="+49">+49 — Alemania</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelCls} htmlFor="tel">
                            Teléfono<span className="text-ldh-orange">*</span>
                          </label>
                          <input
                            id="tel"
                            type="tel"
                            className={`${field} ${phoneErr ? 'border-red-300' : ''}`}
                            inputMode="tel"
                            value={form.telefono}
                            onChange={(e) => update('telefono', e.target.value)}
                            required
                          />
                          {phoneErr ? <p className="mt-1 text-xs text-red-600">{phoneErr}</p> : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-10">
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="rounded-lg bg-ldh-orange px-8 py-3 text-sm font-bold tracking-wide text-white uppercase transition-colors hover:bg-ldh-orange-hover disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Continuar
                  </button>
                </div>
              </form>
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
