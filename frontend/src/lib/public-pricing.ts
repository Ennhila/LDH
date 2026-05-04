import { API_BASE } from './api-base';
import type { PricingQuoteResponse, PublicDeliveryTypeDto } from '../types/api';

export type QuoteInput = {
  originCountry: string;
  originPostalCode: string;
  destinationCountry: string;
  destinationPostalCode: string;
  pickupOffice: boolean;
  deliveryOffice: boolean;
  weightKg: number;
};

export async function fetchActiveDeliveryTypes(): Promise<PublicDeliveryTypeDto[]> {
  const res = await fetch(`${API_BASE}/api/public/pricing/delivery-types`);
  const text = await res.text();
  const data = text ? JSON.parse(text) : [];
  if (!res.ok) {
    throw new Error(typeof data?.detail === 'string' ? data.detail : res.statusText);
  }
  return data as PublicDeliveryTypeDto[];
}

/** Códigos activos (fallo de red → los cuatro tipos para no bloquear el flujo). */
export async function fetchActiveDeliveryTypeCodes(): Promise<Set<string>> {
  try {
    const list = await fetchActiveDeliveryTypes();
    return new Set(list.map((x) => x.code));
  } catch {
    return new Set(['OFFICE_OFFICE', 'OFFICE_HOME', 'HOME_OFFICE', 'HOME_HOME']);
  }
}

export async function fetchPublicQuote(input: QuoteInput): Promise<PricingQuoteResponse> {
  const res = await fetch(`${API_BASE}/api/public/pricing/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(typeof data?.detail === 'string' ? data.detail : res.statusText);
  }
  return data as PricingQuoteResponse;
}
