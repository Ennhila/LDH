import type { PackageTier, ShippingDraft } from './types';
import { PACKAGE_SPECS } from './packageSpecs';

export const DRAFT_STORAGE_KEY = 'ldh_shipping_draft';

const DEFAULT_DRAFT: ShippingDraft = {
  originCountry: 'ES',
  originPostalCode: '41021',
  destinationCountry: 'ES',
  destinationPostalCode: '28001',
  packageTier: '5kg',
};

function isPackageTier(v: string | null): v is PackageTier {
  return v === '2kg' || v === '5kg' || v === '10kg' || v === '20kg';
}

/** Merge URL query (?oC=ES&oCp=...) + sessionStorage; safe for SSR (returns defaults). */
export function readShippingDraftFromWindow(): ShippingDraft {
  if (typeof window === 'undefined') return DEFAULT_DRAFT;

  let fromSession: Partial<ShippingDraft> = {};
  try {
    const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (raw) fromSession = JSON.parse(raw) as Partial<ShippingDraft>;
  } catch {
    /* ignore */
  }

  const params = new URLSearchParams(window.location.search);
  const pkg = params.get('pkg');
  const merged: ShippingDraft = {
    originCountry: params.get('oC') ?? fromSession.originCountry ?? DEFAULT_DRAFT.originCountry,
    originPostalCode: params.get('oCp') ?? fromSession.originPostalCode ?? DEFAULT_DRAFT.originPostalCode,
    destinationCountry:
      params.get('dC') ?? fromSession.destinationCountry ?? DEFAULT_DRAFT.destinationCountry,
    destinationPostalCode:
      params.get('dCp') ?? fromSession.destinationPostalCode ?? DEFAULT_DRAFT.destinationPostalCode,
    packageTier: isPackageTier(pkg)
      ? pkg
      : fromSession.packageTier && isPackageTier(fromSession.packageTier)
        ? fromSession.packageTier
        : DEFAULT_DRAFT.packageTier,
  };

  return merged;
}

export function persistShippingDraft(draft: ShippingDraft): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

/** Mínimo para cotizar (CP ES con al menos 2 dígitos). */
export function canQuoteDraft(d: ShippingDraft): boolean {
  const oDigits = d.originPostalCode.replace(/\D/g, '');
  const dDigits = d.destinationPostalCode.replace(/\D/g, '');
  const originOk = d.originCountry !== 'ES' || oDigits.length >= 2;
  const destOk = d.destinationCountry !== 'ES' || dDigits.length >= 2;
  return originOk && destOk;
}

export function draftToQueryString(d: ShippingDraft): string {
  const p = new URLSearchParams({
    oC: d.originCountry,
    oCp: d.originPostalCode,
    dC: d.destinationCountry,
    dCp: d.destinationPostalCode,
    pkg: d.packageTier,
  });
  return p.toString();
}

/** Human-readable lines for summary UI; replace with API geocoding later. */
const POSTAL_CITY: Record<string, string> = {
  '41021': 'ZAMORA, ZAMORA',
  '28001': 'MADRID, MADRID',
  '08001': 'BARCELONA, BARCELONA',
  '15001': 'A CORUÑA, A CORUÑA',
};

const COUNTRY_SHORT: Record<string, string> = {
  ES: 'ESP',
  PT: 'PRT',
  FR: 'FRA',
  DE: 'DEU',
  IT: 'ITA',
};

export function formatSummaryAddress(postalCode: string, countryCode: string): string {
  const code = postalCode.trim() || '—';
  const city = POSTAL_CITY[code] ?? '—, —';
  const cc = countryCode.toUpperCase();
  const short = COUNTRY_SHORT[cc] ?? cc;
  return `${code}, ${city}, ${short}`;
}

export function getPackageSummaryLines(tier: PackageTier) {
  const s = PACKAGE_SPECS[tier];
  return { weight: s.weightLabel, size: s.sizeLabel };
}
