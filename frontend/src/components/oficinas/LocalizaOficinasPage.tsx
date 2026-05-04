import { useCallback, useEffect, useMemo, useState } from 'react';
import { Copy, ExternalLink } from 'lucide-react';
import { publicApiFetch } from '../../lib/api';
import {
  filterOficinasByPostalCode,
  formatOficinaFullAddress,
  googleMapsSearchUrl,
  normalizePostalDigits,
} from '../../lib/oficinas-filter';
import type { Oficina } from '../../types/api';
import OficinasMap from '../maps/OficinasMap';

function syncCpQueryParam(cp: string) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  const n = normalizePostalDigits(cp);
  if (n) url.searchParams.set('cp', n);
  else url.searchParams.delete('cp');
  window.history.replaceState(null, '', `${url.pathname}${url.search}`);
}

export function LocalizaOficinasPage() {
  const [items, setItems] = useState<Oficina[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cpInput, setCpInput] = useState('');
  const [appliedCp, setAppliedCp] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await publicApiFetch<Oficina[]>('/api/public/oficinas');
        if (!cancelled) setItems(list);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'No se pudieron cargar las oficinas.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cp = params.get('cp');
    if (cp?.trim()) {
      setCpInput(cp.trim());
      setAppliedCp(cp.trim());
    }
  }, []);

  const filtered = useMemo(() => filterOficinasByPostalCode(items, appliedCp), [items, appliedCp]);

  const handleBuscarCp = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedCp(cpInput.trim());
    syncCpQueryParam(cpInput.trim());
  };

  const copyAddress = useCallback(async (o: Oficina) => {
    const text = formatOficinaFullAddress(o);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(o.id);
      window.setTimeout(() => setCopiedId((id) => (id === o.id ? null : id)), 2000);
    } catch {
      window.alert('No se pudo copiar. Copia la dirección manualmente.');
    }
  }, []);

  const openInGoogleMaps = (o: Oficina) => {
    const addr = formatOficinaFullAddress(o);
    window.open(googleMapsSearchUrl(`${addr}, España`), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-ldh-navy sm:text-3xl">Localiza oficinas</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Todas las oficinas LDH en el mapa. Filtra por código postal para acotar la lista.
        </p>
      </div>

      {loading ? (
        <p className="text-slate-600">Cargando oficinas…</p>
      ) : loadError ? (
        <p className="text-red-700" role="alert">
          {loadError}
        </p>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <OficinasMap oficinas={filtered} height="min(420px, 55vh)" />
          </div>

          <form
            className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-end"
            onSubmit={handleBuscarCp}
          >
            <div className="min-w-0 flex-1">
              <label htmlFor="localiza-cp" className="block text-sm font-semibold text-ldh-navy">
                Código postal
              </label>
              <input
                id="localiza-cp"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="Ej. 28001"
                value={cpInput}
                onChange={(e) => setCpInput(e.target.value)}
                className="mt-1.5 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-ldh-navy focus:ring-2 focus:ring-ldh-navy/20 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="min-h-12 shrink-0 rounded-xl bg-ldh-navy px-8 text-sm font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-ldh-navy-dark focus:ring-2 focus:ring-ldh-navy focus:ring-offset-2 focus:outline-none"
            >
              Buscar
            </button>
            <button
              type="button"
              onClick={() => {
                setCpInput('');
                setAppliedCp('');
                syncCpQueryParam('');
              }}
              className="min-h-12 shrink-0 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:ring-2 focus:ring-slate-300 focus:outline-none"
            >
              Ver todas
            </button>
          </form>

          <p className="mt-3 text-sm text-slate-500">
            {normalizePostalDigits(appliedCp)
              ? `Mostrando ${filtered.length} oficina(s) para CP ${normalizePostalDigits(appliedCp)}.`
              : `Mostrando las ${items.length} oficina(s) registradas.`}
          </p>

          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((o) => (
              <li
                key={o.id}
                className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-ldh-orange/40"
              >
                <div className="flex min-w-0 flex-1 gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-ldh-orange/15 p-1.5">
                    <img
                      src="/images/oficina.png"
                      alt=""
                      className="h-full w-full object-contain"
                      width="44"
                      height="44"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-ldh-navy">{o.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{o.addressLine}</p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {o.postalCode} · {o.city}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => void copyAddress(o)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-ldh-navy transition hover:bg-white hover:border-ldh-navy/30 focus:outline-none focus:ring-2 focus:ring-ldh-navy/25"
                    title="Copiar dirección"
                  >
                    <Copy className="h-4 w-4" aria-hidden />
                    {copiedId === o.id ? 'Copiado' : 'Copiar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => openInGoogleMaps(o)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-ldh-orange px-3 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-ldh-orange-hover focus:outline-none focus:ring-2 focus:ring-ldh-orange focus:ring-offset-2"
                    title="Abrir en Google Maps"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden />
                    Maps
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {!filtered.length && items.length > 0 ? (
            <p className="mt-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              No hay oficinas con ese código postal. Prueba otro CP o pulsa «Ver todas».
            </p>
          ) : null}

          {!items.length ? (
            <p className="mt-8 text-slate-600">Aún no hay oficinas publicadas en el sistema.</p>
          ) : null}
        </>
      )}
    </div>
  );
}
