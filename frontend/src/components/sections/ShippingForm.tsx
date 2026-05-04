import { useEffect, useState } from 'react';
import { BookOpen, Briefcase, ChevronDown, ChevronRight, Footprints, HardHat, Lock } from 'lucide-react';
import type { QuoteRequest } from '../../lib/api-placeholder';
import { fetchActiveDeliveryTypes, fetchPublicQuote } from '../../lib/public-pricing';
import { draftToQueryString, persistShippingDraft } from '../../lib/shipping-wizard/draft';
import { PACKAGE_WEIGHT_KG } from '../../lib/shipping-wizard/packageSpecs';
import { PackageSizeCard } from '../ui/PackageSizeCard';

const COUNTRIES = [
  { code: 'ES', label: 'España' },
  { code: 'PT', label: 'Portugal' },
  { code: 'FR', label: 'Francia' },
  { code: 'DE', label: 'Alemania' },
  { code: 'IT', label: 'Italia' },
] as const;

const PACKAGE_OPTIONS: {
  id: QuoteRequest['packageTier'];
  title: string;
  dimensions: string;
  icon: typeof BookOpen;
}[] = [
  { id: '2kg', title: 'Hasta 2kg', dimensions: '30×20×20', icon: BookOpen },
  { id: '5kg', title: 'Hasta 5kg', dimensions: '35×35×24', icon: Footprints },
  { id: '10kg', title: 'Hasta 10kg', dimensions: '40×40×37', icon: HardHat },
  { id: '20kg', title: 'Hasta 20kg', dimensions: '55×55×39', icon: Briefcase },
];

const selectBaseClass =
  'min-h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pr-10 pl-3 text-sm font-medium text-slate-900 shadow-sm focus:border-ldh-orange focus:ring-2 focus:ring-ldh-orange/25 focus:outline-none';

const inputBaseClass =
  'min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-ldh-orange focus:ring-2 focus:ring-ldh-orange/25 focus:outline-none';

export function ShippingForm() {
  const [originCountry, setOriginCountry] = useState('ES');
  const [originPostalCode, setOriginPostalCode] = useState('');
  const [destinationCountry, setDestinationCountry] = useState('ES');
  const [destinationPostalCode, setDestinationPostalCode] = useState('');
  const [packageTier, setPackageTier] = useState<QuoteRequest['packageTier']>('2kg');
  const [quoteEur, setQuoteEur] = useState<number | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [officeOfficeQuoteEnabled, setOfficeOfficeQuoteEnabled] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchActiveDeliveryTypes()
      .then((list) => {
        if (!cancelled) setOfficeOfficeQuoteEnabled(list.some((x) => x.code === 'OFFICE_OFFICE'));
      })
      .catch(() => {
        if (!cancelled) setOfficeOfficeQuoteEnabled(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const oDigits = originPostalCode.replace(/\D/g, '');
    const dDigits = destinationPostalCode.replace(/\D/g, '');
    const originOk = originCountry !== 'ES' || oDigits.length >= 2;
    const destOk = destinationCountry !== 'ES' || dDigits.length >= 2;
    if (!officeOfficeQuoteEnabled || !originOk || !destOk) {
      setQuoteEur(null);
      if (!officeOfficeQuoteEnabled) setQuoteLoading(false);
      return;
    }
    const ac = new AbortController();
    setQuoteLoading(true);
    fetchPublicQuote({
      originCountry,
      originPostalCode: originCountry === 'ES' ? originPostalCode : '',
      destinationCountry,
      destinationPostalCode: destinationCountry === 'ES' ? destinationPostalCode : '',
      pickupOffice: true,
      deliveryOffice: true,
      weightKg: PACKAGE_WEIGHT_KG[packageTier],
    })
      .then((r) => {
        if (!ac.signal.aborted) setQuoteEur(r.totalEur);
      })
      .catch(() => {
        if (!ac.signal.aborted) setQuoteEur(null);
      })
      .finally(() => {
        if (!ac.signal.aborted) setQuoteLoading(false);
      });
    return () => ac.abort();
  }, [
    officeOfficeQuoteEnabled,
    originCountry,
    originPostalCode,
    destinationCountry,
    destinationPostalCode,
    packageTier,
  ]);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      serviceType: 'paqueteria' as const,
      originCountry,
      originPostalCode,
      destinationCountry,
      destinationPostalCode,
      packageTier,
    };
    console.log('[LDH] Comenzar envío (mock):', payload);

    const draft = {
      originCountry,
      originPostalCode,
      destinationCountry,
      destinationPostalCode,
      packageTier,
    };
    persistShippingDraft(draft);
    window.location.assign(`/envio/paso-1?${draftToQueryString(draft)}`);
  };

  const handleMoreInfo = () => {
    console.log('[LDH] Más info — servicio de paquetería');
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/8 sm:p-8">
      <h2 className="text-xl font-bold text-slate-700 sm:text-2xl">Servicio Especial de Paquetería</h2>
      <p className="mt-2 text-sm text-slate-600 sm:text-base">
        Envíos rápidos y baratos para todo el mundo.{' '}
        {!officeOfficeQuoteEnabled ? (
          <span className="font-bold text-slate-600">
            La tarifa oficina→oficina no está disponible; continúa en el asistente de envío para ver
            opciones activas.
          </span>
        ) : quoteLoading ? (
          <span className="font-bold text-slate-500">Calculando tarifa…</span>
        ) : quoteEur != null ? (
          <span className="font-bold text-slate-800">
            Estimación oficina→oficina ({PACKAGE_WEIGHT_KG[packageTier]} kg): desde {quoteEur.toFixed(2)} €
          </span>
        ) : (
          <span className="font-bold text-slate-800">Indica CP/país para ver precio orientativo</span>
        )}
      </p>

      <form className="mt-6 space-y-6" onSubmit={handleStart}>
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-slate-800">
            Indica el producto que quieres enviar
          </legend>
          <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-ldh-navy">
            <input
              type="radio"
              name="service"
              defaultChecked
              className="h-4 w-4 border-slate-300 text-ldh-orange accent-ldh-orange focus:ring-ldh-orange/40"
            />
            Paquetería
          </label>
        </fieldset>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-800">Código postal origen</p>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-slate-600">País</span>
              <div className="relative">
                <select
                  id="origin-country"
                  value={originCountry}
                  onChange={(e) => setOriginCountry(e.target.value)}
                  className={`${selectBaseClass} pl-3`}
                  aria-label="País de origen"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-ldh-navy">
                  {originCountry === 'ES' ? (
                    <Lock className="h-4 w-4 opacity-70" aria-hidden />
                  ) : (
                    <ChevronDown className="h-4 w-4 opacity-80" aria-hidden />
                  )}
                </span>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600" htmlFor="origin-cp">
                Código postal<span className="text-ldh-orange">*</span>
              </label>
              <input
                id="origin-cp"
                type="text"
                inputMode="numeric"
                value={originPostalCode}
                onChange={(e) => setOriginPostalCode(e.target.value)}
                placeholder="Código postal"
                className={inputBaseClass}
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-800">Código postal destino</p>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600" htmlFor="dest-country">
                País<span className="text-ldh-orange">*</span>
              </label>
              <div className="relative">
                <select
                  id="dest-country"
                  value={destinationCountry}
                  onChange={(e) => setDestinationCountry(e.target.value)}
                  className={selectBaseClass}
                  aria-label="País de destino"
                  required
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-ldh-navy">
                  <ChevronDown className="h-4 w-4 opacity-80" aria-hidden />
                </span>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600" htmlFor="dest-cp">
                Código postal
              </label>
              <input
                id="dest-cp"
                type="text"
                inputMode="numeric"
                value={destinationPostalCode}
                onChange={(e) => setDestinationPostalCode(e.target.value)}
                placeholder="Código postal"
                className={inputBaseClass}
              />
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-800">¿Qué tamaño y peso tiene tu paquete?</p>
          <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {PACKAGE_OPTIONS.map(({ id, title, dimensions, icon }) => (
              <PackageSizeCard
                key={id}
                selected={packageTier === id}
                title={title}
                dimensionLabel={dimensions}
                icon={icon}
                onSelect={() => setPackageTier(id)}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-ldh-orange px-8 text-sm font-bold tracking-wide text-white uppercase shadow-md shadow-orange-500/20 transition-colors hover:bg-ldh-orange-hover focus:ring-2 focus:ring-ldh-orange focus:ring-offset-2 focus:outline-none sm:w-auto sm:min-w-[200px]"
          >
            Comenzar envío
          </button>
          <button
            type="button"
            onClick={handleMoreInfo}
            className="inline-flex items-center justify-center gap-0.5 text-sm font-bold uppercase tracking-wide text-ldh-navy underline-offset-4 hover:underline sm:justify-end"
          >
            Más info
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </form>
    </div>
  );
}
