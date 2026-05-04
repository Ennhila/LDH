import { useCallback, useEffect, useState } from 'react';
import { Loader2, MapPin, PackageSearch } from 'lucide-react';
import { fetchPublicShipment } from '../../lib/public-tracking';
import {
  buildShipmentTimeline,
  formatTrackingDateTime,
} from '../../lib/tracking-timeline';
import type { Envio } from '../../types/api';

function syncTrackQueryParam(tracking: string) {
  if (typeof window === 'undefined') return;
  const path = window.location.pathname;
  if (path !== '/' && path !== '/seguimiento') return;
  const url = new URL(window.location.href);
  url.searchParams.set('track', tracking.trim());
  window.history.replaceState(null, '', `${url.pathname}${url.search}`);
}

function readTrackFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const q = new URLSearchParams(window.location.search).get('track');
  return q?.trim() || null;
}

export function TrackingCard() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Envio | null>(null);

  const runSearch = useCallback(async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setError('Introduce un número de seguimiento.');
      setResult(null);
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const envio = await fetchPublicShipment(trimmed);
      setResult(envio);
      syncTrackQueryParam(envio.trackingNumber);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'No se pudo consultar el envío. Inténtalo de nuevo.';
      setError(msg);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fromUrl = readTrackFromUrl();
    if (fromUrl) {
      setTrackingNumber(fromUrl);
      void runSearch(fromUrl);
    }
  }, [runSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void runSearch(trackingNumber);
  };

  const timeline = result ? buildShipmentTimeline(result) : [];

  return (
    <div className="rounded-2xl bg-ldh-orange p-6 shadow-lg shadow-orange-500/20 sm:p-8">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/25 text-ldh-navy">
          <PackageSearch className="h-5 w-5" strokeWidth={2} aria-hidden />
        </span>
        <div>
          <h2 className="text-xl font-bold text-ldh-navy sm:text-2xl">Sigue tu envío</h2>
          <p className="mt-1 text-sm text-ldh-navy/90">
            Consulta el estado solo con tu número de seguimiento. No hace falta iniciar sesión.
          </p>
        </div>
      </div>

      <form className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-stretch" onSubmit={handleSearch}>
        <label className="sr-only" htmlFor="tracking-input">
          Número de seguimiento de envío
        </label>
        <input
          id="tracking-input"
          type="text"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          placeholder="Nº de seguimiento de envío"
          className="min-h-12 w-full flex-1 rounded-xl border border-slate-200/90 bg-white px-4 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-ldh-navy focus:ring-2 focus:ring-ldh-navy/25 focus:outline-none sm:min-w-0"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-ldh-navy px-6 text-sm font-bold uppercase tracking-wide text-white shadow-sm transition-colors hover:bg-ldh-navy-dark focus:ring-2 focus:ring-ldh-navy focus:ring-offset-2 focus:ring-offset-ldh-orange focus:outline-none disabled:opacity-60 sm:w-auto"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Buscando
            </>
          ) : (
            'Buscar'
          )}
        </button>
      </form>

      {error ? (
        <div
          className="mt-5 rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-left text-sm text-red-900"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="mt-6 rounded-2xl bg-white/95 p-5 text-left shadow-md shadow-slate-900/5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Envío</p>
          <p className="mt-1 font-mono text-lg font-bold text-ldh-navy">{result.trackingNumber}</p>
          {result.destinationAddress ? (
            <p className="mt-2 text-sm text-slate-600">
              <span className="font-semibold text-slate-800">Destino: </span>
              {result.destinationAddress}
            </p>
          ) : null}

          <h3 className="mt-6 text-sm font-bold uppercase tracking-wide text-ldh-navy">
            Historial de estado
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            La primera y la última fecha son las registradas en el sistema. Los pasos intermedios muestran una
            hora estimada repartida entre el alta y la última actualización.
          </p>

          <ol className="mt-4">
            {timeline.map((entry, i) => (
              <li key={`${entry.status}-${entry.at.toISOString()}-${i}`} className="flex gap-4">
                <div className="flex w-3 shrink-0 flex-col items-center pt-1.5">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full bg-ldh-orange ring-2 ring-white"
                    aria-hidden
                  />
                  {i < timeline.length - 1 ? (
                    <span className="mt-1 min-h-6 w-0.5 flex-1 rounded-full bg-ldh-orange/35" aria-hidden />
                  ) : null}
                </div>
                <div className={`min-w-0 flex-1 ${i < timeline.length - 1 ? 'pb-5' : ''}`}>
                  <p className="font-bold text-ldh-navy">{entry.label}</p>
                  <p className="mt-0.5 text-sm text-slate-600">
                    {formatTrackingDateTime(entry.at)}
                    {entry.estimated ? (
                      <span className="ml-1 text-xs font-medium text-amber-700">(estimado)</span>
                    ) : null}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-3">
        <a
          href="/localiza-oficinas"
          className="flex min-h-13 w-full items-center gap-3 rounded-xl border border-slate-200/90 bg-white px-4 py-3 text-left text-sm font-semibold text-ldh-navy shadow-sm transition-colors hover:bg-slate-50 focus:ring-2 focus:ring-ldh-navy/30 focus:outline-none"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ldh-orange/15 text-ldh-orange">
            <MapPin className="h-5 w-5" strokeWidth={2} aria-hidden />
          </span>
          Localiza oficinas
        </a>
      </div>
    </div>
  );
}
