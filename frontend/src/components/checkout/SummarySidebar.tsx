import { Pencil } from 'lucide-react';
import type { ShippingDraft } from '../../lib/shipping-wizard/types';
import { formatSummaryAddress, getPackageSummaryLines } from '../../lib/shipping-wizard/draft';

function formatEur(value: number) {
  return `${value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€`;
}

type Props = {
  draft: ShippingDraft;
  /** Título del producto / servicio elegido (paso 1). */
  productTitle?: string | null;
  /** Si hay precio, muestra bloque subtotal / total. */
  pricing?: { subtotal: number; total: number } | null;
  continueLabel?: string;
  onContinue?: () => void | Promise<void>;
  continueDisabled?: boolean;
  /** Estilo del CTA inferior (paso 4: comprar en azul marino). */
  ctaVariant?: 'orange' | 'navy';
};

export function SummarySidebar({
  draft,
  productTitle,
  pricing,
  continueLabel = 'Continuar',
  onContinue,
  continueDisabled = false,
  ctaVariant = 'orange',
}: Props) {
  const { weight, size } = getPackageSummaryLines(draft.packageTier);
  const originLine = formatSummaryAddress(draft.originPostalCode, draft.originCountry);
  const destLine = formatSummaryAddress(draft.destinationPostalCode, draft.destinationCountry);

  const handleEdit = () => {
    console.log('[LDH] Editar resumen (próximamente)');
  };

  return (
    <aside className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg lg:sticky lg:top-24 lg:self-start">
      <div className="flex items-center gap-3 bg-ldh-orange px-4 py-4">
        <img
          src="/images/resumen-envio-logo.png"
          alt=""
          className="h-12 w-auto object-contain sm:h-14"
          width={120}
          height={56}
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-extrabold tracking-wide text-white uppercase sm:text-base">
            Resumen de tu envío
          </h2>
        </div>
        <button
          type="button"
          onClick={handleEdit}
          className="shrink-0 rounded-lg p-2 text-white transition-colors hover:bg-white/15"
          aria-label="Editar resumen"
        >
          <Pencil className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        <div className="flex gap-3">
          <img
            src="/images/origen.png"
            alt=""
            className="mt-0.5 h-8 w-8 shrink-0 object-contain"
            width={32}
            height={32}
          />
          <div className="min-w-0">
            <p className="text-xs font-bold text-ldh-navy uppercase">Origen</p>
            <p className="mt-1 text-sm leading-snug text-slate-700">{originLine}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <img
            src="/images/destino.png"
            alt=""
            className="mt-0.5 h-8 w-8 shrink-0 object-contain"
            width={32}
            height={32}
          />
          <div className="min-w-0">
            <p className="text-xs font-bold text-ldh-navy uppercase">Destino</p>
            <p className="mt-1 text-sm leading-snug text-slate-700">{destLine}</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-ldh-navy uppercase">Tipo de envío</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {productTitle ? (
              <li>
                <span className="font-semibold text-slate-800">Producto:</span> {productTitle}
              </li>
            ) : null}
            <li>
              <span className="font-semibold text-slate-800">Peso:</span> {weight}
            </li>
            <li>
              <span className="font-semibold text-slate-800">Tamaño:</span> {size}
            </li>
          </ul>
        </div>

        {pricing ? (
          <div className="border-t border-slate-200 pt-4">
            <div className="flex justify-between text-sm text-slate-700">
              <span>Subtotal (IVA incl.)</span>
              <span className="font-semibold">{formatEur(pricing.subtotal)}</span>
            </div>
            <div className="mt-2 flex justify-between text-base font-extrabold text-slate-900">
              <span>TOTAL</span>
              <span>{formatEur(pricing.total)}</span>
            </div>
          </div>
        ) : null}
      </div>

      {onContinue ? (
        <div className="border-t border-slate-200 bg-slate-50 p-4 sm:p-5">
          <button
            type="button"
            disabled={continueDisabled}
            onClick={onContinue}
            className={`w-full rounded-lg px-4 py-3 text-sm font-bold tracking-wide text-white uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              ctaVariant === 'navy'
                ? 'bg-ldh-navy hover:bg-ldh-navy-dark'
                : 'bg-ldh-orange hover:bg-ldh-orange-hover'
            }`}
          >
            {continueLabel}
          </button>
        </div>
      ) : null}
    </aside>
  );
}
