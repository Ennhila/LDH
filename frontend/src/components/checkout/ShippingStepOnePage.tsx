import { useEffect, useMemo, useState } from 'react';
import { fetchActiveDeliveryTypes, fetchPublicQuote } from '../../lib/public-pricing';
import { FILTER_BUTTONS } from '../../lib/shipping-wizard/constants';
import {
  canQuoteDraft,
  persistShippingDraft,
  readShippingDraftFromWindow,
} from '../../lib/shipping-wizard/draft';
import { PACKAGE_WEIGHT_KG } from '../../lib/shipping-wizard/packageSpecs';
import { quoteFlagsForDeliveryType } from '../../lib/shipping-wizard/quote-flags';
import {
  filterOptionsByActiveDeliveryTypes,
  filterShippingOptions,
  getShippingOptionById,
  SHIPPING_OPTIONS,
} from '../../lib/shipping-wizard/shippingOptions';
import type { FilterId, ShippingDraft } from '../../lib/shipping-wizard/types';
import { FilterButton } from './FilterButton';
import { ShippingCard } from './ShippingCard';
import { SummarySidebar } from './SummarySidebar';
import { WizardLoginStrip } from './WizardLoginStrip';
import { WizardPageHeader } from './WizardPageHeader';

const SELECTED_OPTION_KEY = 'ldh_shipping_selected_option_id';

export function ShippingStepOnePage() {
  const [draft, setDraft] = useState<ShippingDraft>(() => readShippingDraftFromWindow());
  const [activeFilters, setActiveFilters] = useState<Set<FilterId>>(new Set());
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeDeliveryCodes, setActiveDeliveryCodes] = useState<Set<string> | null>(null);
  const [quotesByOptionId, setQuotesByOptionId] = useState<Record<number, number>>({});
  const [quotesLoading, setQuotesLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchActiveDeliveryTypes()
      .then((list) => {
        if (!cancelled) setActiveDeliveryCodes(new Set(list.map((x) => x.code)));
      })
      .catch(() => {
        if (!cancelled) {
          setActiveDeliveryCodes(
            new Set(['OFFICE_OFFICE', 'OFFICE_HOME', 'HOME_OFFICE', 'HOME_HOME']),
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const d = readShippingDraftFromWindow();
    setDraft(d);
    persistShippingDraft(d);

    try {
      const raw = sessionStorage.getItem(SELECTED_OPTION_KEY);
      if (raw) setSelectedId(Number(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const filteredOptions = useMemo(() => {
    let opts = filterShippingOptions(SHIPPING_OPTIONS, activeFilters);
    if (activeDeliveryCodes != null) {
      opts = filterOptionsByActiveDeliveryTypes(opts, activeDeliveryCodes);
    }
    return opts;
  }, [activeFilters, activeDeliveryCodes]);

  const selectedOption = useMemo(
    () => (selectedId != null ? getShippingOptionById(selectedId) : undefined),
    [selectedId],
  );

  useEffect(() => {
    if (selectedId === null) return;
    const stillVisible = filteredOptions.some((o) => o.id === selectedId);
    if (!stillVisible) {
      setSelectedId(null);
      try {
        sessionStorage.removeItem(SELECTED_OPTION_KEY);
      } catch {
        /* ignore */
      }
    }
  }, [filteredOptions, selectedId]);

  const routeQuotable = useMemo(() => canQuoteDraft(draft), [draft]);

  useEffect(() => {
    if (!routeQuotable || filteredOptions.length === 0) {
      setQuotesByOptionId({});
      setQuotesLoading(false);
      return;
    }

    let cancelled = false;
    setQuotesLoading(true);
    const weightKg = PACKAGE_WEIGHT_KG[draft.packageTier];
    const baseInput = {
      originCountry: draft.originCountry,
      originPostalCode: draft.originCountry === 'ES' ? draft.originPostalCode : '',
      destinationCountry: draft.destinationCountry,
      destinationPostalCode: draft.destinationCountry === 'ES' ? draft.destinationPostalCode : '',
      weightKg,
    };

    void (async () => {
      const entries = await Promise.all(
        filteredOptions.map(async (opt) => {
          try {
            const r = await fetchPublicQuote({
              ...baseInput,
              ...quoteFlagsForDeliveryType(opt.deliveryTypeCode),
            });
            return [opt.id, r.totalEur] as const;
          } catch {
            return [opt.id, undefined] as const;
          }
        }),
      );
      if (cancelled) return;
      const next: Record<number, number> = {};
      for (const [id, total] of entries) {
        if (total !== undefined) next[id] = total;
      }
      setQuotesByOptionId(next);
      setQuotesLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [
    routeQuotable,
    draft.originCountry,
    draft.originPostalCode,
    draft.destinationCountry,
    draft.destinationPostalCode,
    draft.packageTier,
    filteredOptions,
  ]);

  const toggleFilter = (id: FilterId) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearFilters = () => setActiveFilters(new Set());

  const selectOption = (id: number) => {
    setSelectedId(id);
    try {
      sessionStorage.setItem(SELECTED_OPTION_KEY, String(id));
    } catch {
      /* ignore */
    }
    console.log('[LDH] Opción seleccionada (mock):', id);
  };

  const handleContinue = () => {
    if (selectedId == null) return;
    window.location.assign('/envio/paso-2');
  };

  const pricing = useMemo(() => {
    if (selectedOption == null) return null;
    if (!routeQuotable) {
      return { subtotal: selectedOption.price, total: selectedOption.price };
    }
    if (quotesLoading) return null;
    if (selectedId == null) return null;
    const q = quotesByOptionId[selectedId];
    if (q !== undefined) {
      return { subtotal: q, total: q };
    }
    return null;
  }, [selectedOption, routeQuotable, quotesLoading, selectedId, quotesByOptionId]);

  return (
    <div className="flex-1 bg-slate-50">
      <WizardPageHeader
        currentStep={1}
        subtitle="Selecciona el tipo de envío que mejor se adapta a tus necesidades"
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_340px]">
          <div className="order-2 min-w-0 lg:order-1">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {FILTER_BUTTONS.map(({ id, label }) => (
                  <FilterButton
                    key={id}
                    label={label}
                    active={activeFilters.has(id)}
                    onClick={() => toggleFilter(id)}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={clearFilters}
                className="shrink-0 text-xs font-bold text-ldh-orange uppercase underline-offset-2 hover:underline sm:text-sm"
              >
                Borrar filtros
              </button>
            </div>

            <div className="space-y-4">
              {filteredOptions.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-slate-600">
                  {activeDeliveryCodes != null && activeDeliveryCodes.size === 0
                    ? 'No hay tipos de entrega disponibles en este momento. Contacta con LDH o revisa más tarde.'
                    : 'Ningún servicio coincide con los filtros o con los tipos de entrega activos. Prueba a borrar filtros o ajustar la selección.'}
                </p>
              ) : (
                filteredOptions.map((opt) => (
                  <ShippingCard
                    key={opt.id}
                    option={opt}
                    selected={selectedId === opt.id}
                    onSelect={() => selectOption(opt.id)}
                    routeQuotable={routeQuotable}
                    matrixTotalEur={quotesByOptionId[opt.id] ?? null}
                    matrixPending={quotesLoading}
                  />
                ))
              )}
            </div>

            <WizardLoginStrip />
          </div>

          <div className="order-1 lg:order-2">
            <SummarySidebar
              draft={draft}
              productTitle={selectedOption?.title ?? null}
              pricing={pricing}
              onContinue={handleContinue}
              continueDisabled={selectedId == null}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
