import { useEffect, useMemo, useState } from 'react';
import { useRequireRole } from '../../hooks/use-require-role';
import { apiFetch } from '../../lib/api';
import type { Oficina } from '../../types/api';
import OficinasMap from '../maps/OficinasMap';

const PAGE_SIZE = 10;

const emptyForm = {
  name: '',
  addressLine: '',
  postalCode: '',
  city: '',
  latitude: '',
  longitude: '',
};

export default function AdminOficinasPanel() {
  const { me, loading: authLoading } = useRequireRole('ADMIN');
  const [items, setItems] = useState<Oficina[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [listQuery, setListQuery] = useState('');
  const [page, setPage] = useState(1);

  async function refresh() {
    const list = await apiFetch<Oficina[]>('/api/admin/oficinas');
    setItems(list);
  }

  useEffect(() => {
    if (!me) return;
    refresh().catch((e) => setError(e instanceof Error ? e.message : 'Error'));
  }, [me]);

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalOpen]);

  const filteredItems = useMemo(() => {
    const q = listQuery.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!q) return items;
    return items.filter((o) => {
      const hay = [o.name, o.addressLine, o.postalCode, o.city].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [items, listQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));

  const pageItems = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [listQuery]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function openNewModal() {
    setError(null);
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const latStr = form.latitude.trim();
    const lngStr = form.longitude.trim();
    /** Solo si ambos campos manuales son válidos; si no, el backend geocodifica con dirección+CP+ciudad. */
    const manualBoth =
      latStr !== '' &&
      lngStr !== '' &&
      Number.isFinite(Number(latStr)) &&
      Number.isFinite(Number(lngStr));
    const body = {
      name: form.name.trim(),
      addressLine: form.addressLine.trim(),
      postalCode: form.postalCode.trim(),
      city: form.city.trim(),
      latitude: manualBoth ? Number(latStr) : null,
      longitude: manualBoth ? Number(lngStr) : null,
    };
    try {
      if (editingId != null) {
        await apiFetch(`/api/admin/oficinas/${editingId}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        await apiFetch('/api/admin/oficinas', { method: 'POST', body: JSON.stringify(body) });
      }
      setModalOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }

  function startEdit(o: Oficina) {
    setError(null);
    setEditingId(o.id);
    setForm({
      name: o.name,
      addressLine: o.addressLine,
      postalCode: o.postalCode,
      city: o.city,
      latitude: o.latitude != null ? String(o.latitude) : '',
      longitude: o.longitude != null ? String(o.longitude) : '',
    });
    setModalOpen(true);
  }

  async function remove(id: number) {
    if (!confirm('¿Eliminar oficina?')) return;
    setError(null);
    try {
      await apiFetch(`/api/admin/oficinas/${id}`, { method: 'DELETE' });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }

  if (authLoading || !me) return <p className="text-slate-600">Cargando…</p>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ldh-navy">Oficinas</h1>
          <p className="mt-1 text-slate-600">Alta, edición y mapa de ubicaciones.</p>
        </div>
        <button
          type="button"
          onClick={openNewModal}
          className="shrink-0 rounded-lg bg-ldh-orange px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-ldh-orange-hover focus:outline-none focus:ring-2 focus:ring-ldh-orange focus:ring-offset-2"
        >
          Añadir
        </button>
      </div>

      {error ? <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div> : null}

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Mapa</h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <OficinasMap oficinas={items} height="min(420px, 50vh)" />
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-semibold text-ldh-navy" htmlFor="admin-oficinas-buscar">
          Buscar oficina
        </label>
        <input
          id="admin-oficinas-buscar"
          type="search"
          value={listQuery}
          onChange={(e) => setListQuery(e.target.value)}
          placeholder="Nombre, dirección, código postal o ciudad…"
          className="w-full max-w-xl rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm placeholder:text-slate-400 focus:border-ldh-navy focus:outline-none focus:ring-2 focus:ring-ldh-navy/20"
          autoComplete="off"
        />
        <p className="text-xs text-slate-500">
          {filteredItems.length === items.length
            ? `${items.length} oficina(s) en total.`
            : `${filteredItems.length} coincidencia(s) de ${items.length}.`}{' '}
          Mostrando {pageItems.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0}–
          {(page - 1) * PAGE_SIZE + pageItems.length} en esta página.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Dirección</th>
              <th className="px-4 py-3">CP</th>
              <th className="px-4 py-3">Ciudad</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {pageItems.map((o) => (
              <tr key={o.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{o.name}</td>
                <td className="px-4 py-3 text-slate-600">{o.addressLine}</td>
                <td className="px-4 py-3">{o.postalCode}</td>
                <td className="px-4 py-3">{o.city}</td>
                <td className="px-4 py-3 text-right">
                  <button type="button" className="text-ldh-navy hover:underline" onClick={() => startEdit(o)}>
                    Editar
                  </button>
                  <button type="button" className="ml-3 text-red-600 hover:underline" onClick={() => remove(o.id)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pageItems.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">No hay oficinas que coincidan con la búsqueda.</p>
        ) : null}
      </div>

      {filteredItems.length > PAGE_SIZE ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <p className="text-sm text-slate-600">
            Página <span className="font-semibold text-ldh-navy">{page}</span> de{' '}
            <span className="font-semibold text-ldh-navy">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ldh-navy transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ldh-navy transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      ) : null}

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="oficina-modal-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]"
            aria-label="Cerrar"
            onClick={closeModal}
          />
          <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 id="oficina-modal-title" className="text-lg font-semibold text-ldh-navy">
                {editingId ? 'Editar oficina' : 'Nueva oficina'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                aria-label="Cerrar ventana"
              >
                <span className="block text-xl leading-none" aria-hidden>
                  ×
                </span>
              </button>
            </div>
            <form onSubmit={onSubmit} className="space-y-3">
              <input
                required
                placeholder="Nombre"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                required
                placeholder="Dirección"
                value={form.addressLine}
                onChange={(e) => setForm((f) => ({ ...f, addressLine: e.target.value }))}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  required
                  placeholder="CP"
                  value={form.postalCode}
                  onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
                  className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                />
                <input
                  required
                  placeholder="Ciudad"
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <p className="text-xs text-slate-500">
                Si dejas latitud y longitud vacías, el servidor calcula la posición con la dirección (OpenStreetMap
                Nominatim) y aparecerá el punto en el mapa.
              </p>
              <details className="rounded-md border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm">
                <summary className="cursor-pointer font-medium text-slate-700">Coordenadas manuales (opcional)</summary>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <input
                    placeholder="Latitud"
                    value={form.latitude}
                    onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                  <input
                    placeholder="Longitud"
                    value={form.longitude}
                    onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
              </details>
              <div className="flex flex-wrap gap-2 pt-2">
                <button type="submit" className="rounded-md bg-ldh-orange px-4 py-2 text-sm font-semibold text-white">
                  {editingId ? 'Guardar' : 'Crear'}
                </button>
                <button type="button" className="rounded-md border border-slate-200 px-4 py-2 text-sm" onClick={closeModal}>
                  Cerrar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
