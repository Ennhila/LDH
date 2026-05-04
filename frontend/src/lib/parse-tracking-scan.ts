/**
 * Clave estable para comparar escaneo ↔ número en BD (ignora guiones, espacios, etc.).
 * Muchos lectores CODE128 devuelven solo caracteres alfanuméricos sin guiones.
 */
export function normalizeTrackingKey(s: string): string {
  return s.normalize('NFKC').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

/**
 * Normaliza texto leído de Code128 / QR u otros.
 * El QR de etiqueta puede ser una URL con ?t=TRACKING o similar.
 */
export function parseTrackingFromScan(raw: string): string {
  let trimmed = raw.trim().normalize('NFKC').replace(/[\u0000-\u001F\u007F]/g, '');
  if (!trimmed) return '';

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const u = new URL(trimmed);
      const q =
        u.searchParams.get('t') ??
        u.searchParams.get('track') ??
        u.searchParams.get('tracking');
      if (q?.trim()) return q.trim();

      const pathMatch = u.pathname.match(/\/(?:track|seguimiento)\/([^/?]+)/i);
      if (pathMatch?.[1]) return decodeURIComponent(pathMatch[1]);
    } catch {
      /* seguir con texto crudo */
    }
  }

  trimmed = trimmed.replace(/\s+/g, '');
  return trimmed;
}

export function findEnvioByTracking<T extends { trackingNumber: string }>(
  items: T[],
  trackingParsed: string,
): T | undefined {
  const needle = normalizeTrackingKey(trackingParsed);
  if (!needle) return undefined;
  return items.find((e) => normalizeTrackingKey(e.trackingNumber) === needle);
}
