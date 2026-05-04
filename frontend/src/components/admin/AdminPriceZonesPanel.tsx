import { Fragment, useCallback, useEffect, useState } from 'react';
import { useRequireRole } from '../../hooks/use-require-role';
import { apiFetch } from '../../lib/api';
import type { ShippingZoneDto } from '../../types/api';

type OficinaRow = { id: number; name: string; postalCode: string; city: string };
type RepRow = { id: number; email: string; fullName: string; postalCode: string; enabled: boolean };

export default function AdminPriceZonesPanel() {
  const { me, loading: authLoading } = useRequireRole('ADMIN');
  const [zones, setZones] = useState<ShippingZoneDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [oficinas, setOficinas] = useState<OficinaRow[] | null>(null);
  const [repartidores, setRepartidores] = useState<RepRow[] | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: '',
    name: '',
    international: false,
    displayOrder: 100,
    flagEmoji: '',
    prefixesRaw: '',
  });
  const [prefixInput, setPrefixInput] = useState<Record<number, string>>({});

  const refresh = useCallback(async () => {
    const list = await apiFetch<ShippingZoneDto[]>('/api/admin/prices/zones');
    setZones(list);
  }, []);

  useEffect(() => {
    if (!me) return;
    refresh().catch((e) => setError(e instanceof Error ? e.message : 'Error'));
  }, [me, refresh]);

  async function loadDetail(zoneId: number) {
    setLoadingDetail(true);
    setError(null);
    try {
      const [o, r] = await Promise.all([
        apiFetch<OficinaRow[]>(`/api/admin/prices/zones/${zoneId}/oficinas`),
        apiFetch<RepRow[]>(`/api/admin/prices/zones/${zoneId}/repartidores`),
      ]);
      setOficinas(o);
      setRepartidores(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoadingDetail(false);
    }
  }

  function toggleExpand(id: number) {
    if (expanded === id) {
      setExpanded(null);
      setOficinas(null);
      setRepartidores(null);
      return;
    }
    setExpanded(id);
    void loadDetail(id);
  }

  async function submitZone(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const prefixes = form.prefixesRaw
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      await apiFetch('/api/admin/prices/zones', {
        method: 'POST',
        body: JSON.stringify({
          code: form.code.trim(),
          name: form.name.trim(),
          international: form.international,
          displayOrder: form.displayOrder,
          flagEmoji: form.flagEmoji.trim() || null,
          prefixes,
        }),
      });
      setShowForm(false);
      setForm({ code: '', name: '', international: false, displayOrder: 100, flagEmoji: '', prefixesRaw: '' });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }

  async function addPrefix(zoneId: number) {
    const raw = prefixInput[zoneId]?.trim();
    if (!raw) return;
    setError(null);
    try {
      await apiFetch(`/api/admin/prices/zones/${zoneId}/prefixes`, {
        method: 'POST',
        body: JSON.stringify({ prefix: raw }),
      });
      setPrefixInput((p) => ({ ...p, [zoneId]: '' }));
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }

  async function removePrefix(zoneId: number, prefixId: number) {
    if (!confirm('¿Quitar prefijo?')) return;
    setError(null);
    try {
      await apiFetch(`/api/admin/prices/zones/${zoneId}/prefixes/${prefixId}`, { method: 'DELETE' });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }

  async function removeZone(id: number) {
    if (!confirm('¿Eliminar zona? Requiere que no haya celdas de matriz.')) return;
    setError(null);
    try {
      await apiFetch(`/api/admin/prices/zones/${id}`, { method: 'DELETE' });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }

  if (authLoading || !me) return <p className="text-slate-600">Cargando…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ldh-navy">Gerente de zona</h1>
        <p className="mt-1 text-slate-600">
          Zonas según prefijos CP (2 dígitos España) o ISO país. Oficinas y repartidores se muestran por coincidencia de
          CP.
        </p>
      </div>
      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>}

      <button
        type="button"
        onClick={() => setShowForm((s) => !s)}
        className="rounded-md bg-ldh-orange px-4 py-2 text-sm font-semibold text-white hover:bg-ldh-orange-hover"
      >
        {showForm ? 'Cerrar formulario' : 'Nueva zona'}
      </button>

      {showForm && (
        <form onSubmit={submitZone} className="max-w-xl space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="font-semibold text-ldh-navy">Alta de zona</h2>
          <input
            required
            placeholder="Código (ej. ZONE_21)"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            required
            placeholder="Nombre"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.international}
              onChange={(e) => setForm((f) => ({ ...f, international: e.target.checked }))}
            />
            Zona internacional (prefijos = ISO país)
          </label>
          <input
            type="number"
            placeholder="Orden"
            value={form.displayOrder}
            onChange={(e) => setForm((f) => ({ ...f, displayOrder: Number(e.target.value) }))}
            className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            placeholder="Emoji bandera (opcional)"
            value={form.flagEmoji}
            onChange={(e) => setForm((f) => ({ ...f, flagEmoji: e.target.value }))}
            className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
          />
          <textarea
            placeholder={form.international ? 'Prefijos ISO: FR, DE, IT…' : 'Prefijos CP: 28, 08…'}
            value={form.prefixesRaw}
            onChange={(e) => setForm((f) => ({ ...f, prefixesRaw: e.target.value }))}
            className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
            rows={3}
          />
          <button type="submit" className="rounded-md bg-ldh-navy px-4 py-2 text-sm font-semibold text-white">
            Guardar zona
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Zona</th>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Intl</th>
              <th className="px-3 py-2">Prefijos</th>
              <th className="px-3 py-2">Celdas activas</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {zones.map((z) => (
              <Fragment key={z.id}>
                <tr className="border-t border-slate-100">
                  <td className="px-3 py-2 font-mono text-xs">{z.code}</td>
                  <td className="px-3 py-2">
                    <span className="mr-1">{z.flagEmoji ?? ''}</span>
                    {z.name}
                  </td>
                  <td className="px-3 py-2">{z.international ? 'Sí' : 'No'}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {z.prefixes.map((p) => (
                        <span
                          key={p.id}
                          className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs"
                        >
                          {p.prefix}
                          <button
                            type="button"
                            className="text-red-600 hover:underline"
                            onClick={() => void removePrefix(z.id, p.id)}
                            aria-label={`Quitar ${p.prefix}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="mt-1 flex gap-1">
                      <input
                        placeholder="+ prefijo"
                        value={prefixInput[z.id] ?? ''}
                        onChange={(e) => setPrefixInput((s) => ({ ...s, [z.id]: e.target.value }))}
                        className="w-24 rounded border border-slate-200 px-2 py-1 text-xs"
                      />
                      <button
                        type="button"
                        className="text-xs font-semibold text-ldh-orange hover:underline"
                        onClick={() => void addPrefix(z.id)}
                      >
                        Añadir
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2">{z.activeMatrixRuleCount}</td>
                  <td className="px-3 py-2 text-right">
                    <button type="button" className="text-ldh-navy hover:underline" onClick={() => toggleExpand(z.id)}>
                      {expanded === z.id ? 'Ocultar' : 'Oficinas / Repartidores'}
                    </button>
                    <button type="button" className="ml-2 text-red-600 hover:underline" onClick={() => void removeZone(z.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
                {expanded === z.id && (
                  <tr className="bg-slate-50">
                    <td colSpan={6} className="px-3 py-4">
                      {loadingDetail ? (
                        <p className="text-slate-600">Cargando…</p>
                      ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <h3 className="text-xs font-bold uppercase text-slate-500">Oficinas (CP en zona)</h3>
                            <ul className="mt-2 max-h-48 overflow-auto text-xs">
                              {oficinas?.length ? (
                                oficinas.map((o) => (
                                  <li key={o.id}>
                                    {o.name} — {o.postalCode} {o.city}
                                  </li>
                                ))
                              ) : (
                                <li className="text-slate-500">Ninguna o zona internacional</li>
                              )}
                            </ul>
                          </div>
                          <div>
                            <h3 className="text-xs font-bold uppercase text-slate-500">Repartidores (CP base)</h3>
                            <ul className="mt-2 max-h-48 overflow-auto text-xs">
                              {repartidores?.length ? (
                                repartidores.map((r) => (
                                  <li key={r.id}>
                                    {r.fullName} — {r.postalCode} ({r.enabled ? 'activo' : 'inactivo'})
                                  </li>
                                ))
                              ) : (
                                <li className="text-slate-500">Ninguno</li>
                              )}
                            </ul>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
