import type { Oficina } from '../types/api';

export function normalizePostalDigits(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 5);
}

/** Sin CP aplicado devuelve todo el catálogo. Con CP: exacto a 5 dígitos o prefijo si es más corto. */
export function filterOficinasByPostalCode(oficinas: Oficina[], cpRaw: string): Oficina[] {
  const n = normalizePostalDigits(cpRaw);
  if (!n) return oficinas;
  if (n.length >= 5) {
    return oficinas.filter((o) => normalizePostalDigits(o.postalCode) === n);
  }
  return oficinas.filter((o) => normalizePostalDigits(o.postalCode).startsWith(n));
}

export function formatOficinaFullAddress(o: Oficina): string {
  return `${o.addressLine}, ${o.postalCode} ${o.city}`.replace(/\s+/g, ' ').trim();
}

export function googleMapsSearchUrl(address: string): string {
  const q = encodeURIComponent(address);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}
