import { Check } from 'lucide-react';
import type { PickupDeliveryType, ShippingOption } from '../../lib/shipping-wizard/types';

const iconFor = (type: PickupDeliveryType) =>
  type === 'Oficina' ? '/images/oficina.png' : '/images/domicilio.png';

function formatEur(value: number) {
  return `${value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€`;
}

type Props = {
  option: ShippingOption;
  selected: boolean;
  onSelect: () => void;
  /** Hay CP/país suficiente para pedir precio a la matriz. */
  routeQuotable: boolean;
  /** Total IVA incl. desde API; null si error o aún no cargado. */
  matrixTotalEur: number | null;
  /** Cotización en curso para la ruta actual. */
  matrixPending: boolean;
};

export function ShippingCard({
  option,
  selected,
  onSelect,
  routeQuotable,
  matrixTotalEur,
  matrixPending,
}: Props) {
  const showMock = !routeQuotable;
  const showLoading = routeQuotable && matrixPending;
  const showUnavailable = routeQuotable && !matrixPending && matrixTotalEur == null;
  const mainEur = showMock ? option.price : matrixTotalEur;
  const noTaxEur =
    showMock ? option.priceNoTax : mainEur != null ? mainEur / 1.21 : null;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full overflow-hidden rounded-lg border bg-white text-left shadow-md transition-shadow outline-none ${
        selected
          ? 'border-ldh-orange ring-2 ring-ldh-orange/35'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-lg'
      }`}
    >
      <div className="flex flex-col sm:flex-row">
        <div className="flex shrink-0 flex-col justify-center rounded-t-lg bg-ldh-orange px-4 py-4 text-center sm:w-36 sm:rounded-t-none sm:rounded-l-lg">
          <span className="text-[10px] font-semibold text-white/90 uppercase sm:text-xs">
            Entrega estimada
          </span>
          <span className="mt-1 text-lg font-extrabold text-white sm:text-xl">{option.deliveryTime}</span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col border-t border-slate-100 sm:border-t-0 sm:border-l">
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch sm:justify-between sm:p-5">
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-slate-800 sm:text-lg">{option.title}</h3>

              <div className="mt-4 flex items-end justify-center gap-3 sm:justify-start md:gap-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-orange-50 p-1.5 ring-1 ring-ldh-orange/25">
                    <img
                      src={iconFor(option.pickup)}
                      alt=""
                      className="max-h-9 max-w-9 object-contain"
                      width={36}
                      height={36}
                    />
                  </div>
                  <div className="text-center text-[10px] text-slate-600 sm:text-xs">
                    <span className="block font-bold text-slate-800">Recogida</span>
                    <span>{option.pickup}</span>
                  </div>
                </div>

                <div className="mb-8 hidden h-px w-10 bg-slate-300 sm:block md:w-16" aria-hidden />

                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-orange-50 p-1.5 ring-1 ring-ldh-orange/25">
                    <img
                      src={iconFor(option.delivery)}
                      alt=""
                      className="max-h-9 max-w-9 object-contain"
                      width={36}
                      height={36}
                    />
                  </div>
                  <div className="text-center text-[10px] text-slate-600 sm:text-xs">
                    <span className="block font-bold text-slate-800">Entrega</span>
                    <span>{option.delivery}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t border-slate-100 pt-4 text-center sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6 sm:text-right">
              {showLoading ? (
                <p className="text-2xl font-extrabold text-slate-400" aria-busy="true">
                  …
                </p>
              ) : showUnavailable ? (
                <p className="text-2xl font-extrabold text-slate-400">—</p>
              ) : mainEur != null && noTaxEur != null ? (
                <>
                  <p className="text-2xl font-extrabold text-slate-900">{formatEur(mainEur)}</p>
                  <p className="text-xs text-slate-500">({formatEur(noTaxEur)} sin IVA)</p>
                </>
              ) : null}
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-50/80 px-4 py-3 sm:px-5">
            <ul className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:gap-x-6">
              {option.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-slate-700 sm:text-sm">
                  <Check className="h-4 w-4 shrink-0 text-ldh-navy" strokeWidth={2.5} aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </button>
  );
}
