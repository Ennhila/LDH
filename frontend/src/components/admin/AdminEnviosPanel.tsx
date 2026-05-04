import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRequireRole } from '../../hooks/use-require-role';
import { apiFetch } from '../../lib/api';
import { fetchAdminCheckoutSnapshot } from '../../lib/admin-checkout-snapshot';
import { downloadEnviosCsv } from '../../lib/admin-envios-export';
import { downloadFacturaPdf } from '../../lib/pdf/factura-pdf';
import { orderSnapshotFromServerPayload } from '../../lib/pdf/order-snapshot';
import { formatTrackingDateTime } from '../../lib/tracking-timeline';
import type { Envio, EnvioStatus, EnvioStatusAuditEntry } from '../../types/api';

const statusLabel: Record<string, string> = {
  PENDING: 'Pendiente',
  PICKED_UP: 'Recogido',
  IN_TRANSIT: 'En tránsito',
  OUT_FOR_DELIVERY: 'En reparto',
  DELIVERED: 'Entregado',
  EXCEPTION: 'Incidencia',
};

const ALL_STATUSES: EnvioStatus[] = [
  'PENDING',
  'PICKED_UP',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'EXCEPTION',
];

const WEIGHT_BUCKETS = [2, 5, 10, 20] as const;

function weightCategory(e: Envio): 'none' | '2' | '5' | '10' | '20' | 'other' {
  const w = e.packageWeightKg;
  if (w == null) return 'none';
  for (const b of WEIGHT_BUCKETS) {
    if (Math.abs(w - b) < 0.01) return String(b) as '2' | '5' | '10' | '20';
  }
  return 'other';
}

function allStatusesTrue(m: Record<EnvioStatus, boolean>): boolean {
  return ALL_STATUSES.every((s) => m[s]);
}

function allWeightTrue(m: Record<'none' | '2' | '5' | '10' | '20' | 'other', boolean>): boolean {
  return m.none && m['2'] && m['5'] && m['10'] && m['20'] && m.other;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export default function AdminEnviosPanel() {
  const { me, loading: authLoading } = useRequireRole('ADMIN');
  const [items, setItems] = useState<Envio[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(10);

  const [searchTracking, setSearchTracking] = useState('');
  const [searchCliente, setSearchCliente] = useState('');
  const [searchOrigen, setSearchOrigen] = useState('');
  const [searchDestino, setSearchDestino] = useState('');
  const [searchDestinatario, setSearchDestinatario] = useState('');

  const [statusOn, setStatusOn] = useState<Record<EnvioStatus, boolean>>(() =>
    Object.fromEntries(ALL_STATUSES.map((s) => [s, true])) as Record<EnvioStatus, boolean>,
  );

  const [weightOn, setWeightOn] = useState({
    none: true,
    '2': true,
    '5': true,
    '10': true,
    '20': true,
    other: true,
  });

  const [detail, setDetail] = useState<Envio | null>(null);
  const [audit, setAudit] = useState<EnvioStatusAuditEntry[] | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [adminStatus, setAdminStatus] = useState<EnvioStatus>('PENDING');
  const [adminExceptionReason, setAdminExceptionReason] = useState('');
  const [adminExceptionNotes, setAdminExceptionNotes] = useState('');
  const [detailBusy, setDetailBusy] = useState(false);

  const refresh = useCallback(async () => {
    const list = await apiFetch<Envio[]>('/api/admin/envios');
    setItems(list);
  }, []);

  useEffect(() => {
    if (!me) return;
    refresh().catch((e) => setError(e instanceof Error ? e.message : 'Error'));
  }, [me, refresh]);

  const filteredItems = useMemo(() => {
    const t = searchTracking.trim().toLowerCase();
    const c = searchCliente.trim().toLowerCase();
    const o = searchOrigen.trim().toLowerCase();
    const d = searchDestino.trim().toLowerCase();
    const r = searchDestinatario.trim().toLowerCase();

    const statusFilterActive = !allStatusesTrue(statusOn);
    const weightFilterActive = !allWeightTrue(weightOn);

    return items.filter((e) => {
      if (t && !e.trackingNumber.toLowerCase().includes(t)) return false;
      if (c && !(e.clientEmail ?? '').toLowerCase().includes(c)) return false;
      if (o) {
        const orig = `${e.originAddress ?? ''} ${e.originPostalCode ?? ''}`.toLowerCase();
        if (!orig.includes(o)) return false;
      }
      if (d) {
        const dest = `${e.destinationAddress ?? ''} ${e.destinationPostalCode ?? ''}`.toLowerCase();
        if (!dest.includes(d)) return false;
      }
      if (r && !(e.recipientName ?? '').toLowerCase().includes(r)) return false;

      if (statusFilterActive && !statusOn[e.status]) return false;

      if (weightFilterActive) {
        const cat = weightCategory(e);
        if (!weightOn[cat]) return false;
      }

      return true;
    });
  }, [
    items,
    searchTracking,
    searchCliente,
    searchOrigen,
    searchDestino,
    searchDestinatario,
    statusOn,
    weightOn,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));

  const pageItems = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [
    searchTracking,
    searchCliente,
    searchOrigen,
    searchDestino,
    searchDestinatario,
    statusOn,
    weightOn,
    pageSize,
  ]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const openDetail = useCallback((e: Envio) => {
    setDetail(e);
    setAdminStatus(e.status);
    setAdminExceptionReason(e.exceptionReason ?? '');
    setAdminExceptionNotes(e.exceptionNotes ?? '');
    setDetailError(null);
    setAudit(null);
    setAuditLoading(true);
    void apiFetch<EnvioStatusAuditEntry[]>(`/api/admin/envios/${e.id}/audit`)
      .then((a) => setAudit(a))
      .catch(() => setAudit([]))
      .finally(() => setAuditLoading(false));
  }, []);

  const closeDetail = () => {
    setDetail(null);
    setAudit(null);
    setDetailError(null);
  };

  async function saveAdminStatus() {
    if (!detail) return;
    if (adminStatus === 'EXCEPTION' && !adminExceptionReason.trim()) {
      setDetailError('Indica un motivo de incidencia.');
      return;
    }
    setDetailError(null);
    setDetailBusy(true);
    try {
      const updated = await apiFetch<Envio>(`/api/admin/envios/${detail.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: adminStatus,
          currentLatitude: null,
          currentLongitude: null,
          lastLocationLabel: null,
          exceptionReason: adminStatus === 'EXCEPTION' ? adminExceptionReason.trim() : null,
          exceptionNotes: adminStatus === 'EXCEPTION' ? adminExceptionNotes.trim() || null : null,
        }),
      });
      await refresh();
      openDetail(updated);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setDetailBusy(false);
    }
  }

  async function handleDownloadFactura() {
    if (!detail) return;
    setDetailError(null);
    setDetailBusy(true);
    try {
      const r = await fetchAdminCheckoutSnapshot(detail.id);
      const snap = orderSnapshotFromServerPayload(r.trackingNumber, r.createdAtIso, r.snapshotPayloadJson);
      if (!snap) {
        setDetailError('No hay datos de factura guardados para este envío.');
        return;
      }
      await downloadFacturaPdf(snap);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'No se pudo generar la factura');
    } finally {
      setDetailBusy(false);
    }
  }

  function clearFilters() {
    setSearchTracking('');
    setSearchCliente('');
    setSearchOrigen('');
    setSearchDestino('');
    setSearchDestinatario('');
    setStatusOn(Object.fromEntries(ALL_STATUSES.map((s) => [s, true])) as Record<EnvioStatus, boolean>);
    setWeightOn({
      none: true,
      '2': true,
      '5': true,
      '10': true,
      '20': true,
      other: true,
    });
  }

  function exportCsv() {
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    downloadEnviosCsv(`ldh-envios-filtrados-${stamp}.csv`, filteredItems);
  }

  useEffect(() => {
    if (!detail) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') closeDetail();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [detail]);

  if (authLoading || !me) return <p className="text-slate-600">Cargando…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ldh-navy">Envíos</h1>
          <p className="mt-1 text-slate-600">Todos los envíos del sistema. Filtra, exporta y gestiona incidencias.</p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="shrink-0 rounded-lg border-2 border-ldh-navy bg-white px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-ldh-navy shadow-sm transition hover:bg-slate-50"
        >
          Exportar CSV
        </button>
      </div>

      {error ? <p className="text-red-600">{error}</p> : null}

      <section
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        aria-label="Filtros de envíos"
      >
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ldh-navy">Filtros</h2>
          <button
            type="button"
            onClick={clearFilters}
            className="self-start rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 sm:self-auto"
          >
            Limpiar filtros
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="f-tracking">
              Nº seguimiento
            </label>
            <input
              id="f-tracking"
              type="search"
              value={searchTracking}
              onChange={(e) => setSearchTracking(e.target.value)}
              placeholder="LDH-…"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-ldh-navy focus:outline-none focus:ring-2 focus:ring-ldh-navy/15"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="f-cliente">
              Cliente (email)
            </label>
            <input
              id="f-cliente"
              type="search"
              value={searchCliente}
              onChange={(e) => setSearchCliente(e.target.value)}
              placeholder="correo@…"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-ldh-navy focus:outline-none focus:ring-2 focus:ring-ldh-navy/15"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="f-origen">
              Origen
            </label>
            <input
              id="f-origen"
              type="search"
              value={searchOrigen}
              onChange={(e) => setSearchOrigen(e.target.value)}
              placeholder="Dirección o CP origen"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-ldh-navy focus:outline-none focus:ring-2 focus:ring-ldh-navy/15"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="f-destino">
              Destino
            </label>
            <input
              id="f-destino"
              type="search"
              value={searchDestino}
              onChange={(e) => setSearchDestino(e.target.value)}
              placeholder="Dirección o CP destino"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-ldh-navy focus:outline-none focus:ring-2 focus:ring-ldh-navy/15"
              autoComplete="off"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <label
              className="block text-xs font-semibold uppercase tracking-wide text-slate-500"
              htmlFor="f-destinatario"
            >
              Destinatario
            </label>
            <input
              id="f-destinatario"
              type="search"
              value={searchDestinatario}
              onChange={(e) => setSearchDestinatario(e.target.value)}
              placeholder="Nombre del destinatario"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-ldh-navy focus:outline-none focus:ring-2 focus:ring-ldh-navy/15"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <fieldset>
            <legend className="text-xs font-bold uppercase tracking-wide text-slate-500">Estado</legend>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
              {ALL_STATUSES.map((s) => (
                <label key={s} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={statusOn[s]}
                    onChange={(e) => setStatusOn((prev) => ({ ...prev, [s]: e.target.checked }))}
                    className="rounded border-slate-300 text-ldh-orange focus:ring-ldh-orange"
                  />
                  {statusLabel[s] ?? s}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xs font-bold uppercase tracking-wide text-slate-500">Peso (kg)</legend>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={weightOn.none}
                  onChange={(e) => setWeightOn((w) => ({ ...w, none: e.target.checked }))}
                  className="rounded border-slate-300 text-ldh-orange focus:ring-ldh-orange"
                />
                Sin registrar
              </label>
              {WEIGHT_BUCKETS.map((b) => (
                <label key={b} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={weightOn[String(b) as '2' | '5' | '10' | '20']}
                    onChange={(e) =>
                      setWeightOn((w) => ({ ...w, [String(b)]: e.target.checked } as typeof weightOn))
                    }
                    className="rounded border-slate-300 text-ldh-orange focus:ring-ldh-orange"
                  />
                  {b} kg
                </label>
              ))}
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={weightOn.other}
                  onChange={(e) => setWeightOn((w) => ({ ...w, other: e.target.checked }))}
                  className="rounded border-slate-300 text-ldh-orange focus:ring-ldh-orange"
                />
                Otro
              </label>
            </div>
          </fieldset>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-ldh-navy">{filteredItems.length}</span> resultado(s) de{' '}
            <span className="font-semibold text-ldh-navy">{items.length}</span> envíos.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="page-size-envios" className="text-xs font-semibold uppercase text-slate-500">
              Por página
            </label>
            <select
              id="page-size-envios"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value) as (typeof PAGE_SIZE_OPTIONS)[number])}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-ldh-navy focus:border-ldh-navy focus:outline-none focus:ring-2 focus:ring-ldh-navy/15"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-[1080px] w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-3">Seguimiento</th>
              <th className="px-3 py-3">Estado</th>
              <th className="px-3 py-3">Cliente</th>
              <th className="px-3 py-3">Origen</th>
              <th className="px-3 py-3">Destino</th>
              <th className="px-3 py-3">Peso</th>
              <th className="px-3 py-3">Remitente / Destinatario</th>
              <th className="px-3 py-3">Total</th>
              <th className="px-3 py-3"> </th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((e) => (
              <tr key={e.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-mono text-xs">{e.trackingNumber}</td>
                <td className="px-3 py-2">
                  {statusLabel[e.status] ?? e.status}
                  {e.status === 'EXCEPTION' && e.exceptionReason ? (
                    <div className="text-[10px] font-medium text-amber-800">{e.exceptionReason}</div>
                  ) : null}
                </td>
                <td className="px-3 py-2 text-xs">{e.clientEmail}</td>
                <td className="max-w-[140px] px-3 py-2 text-xs text-slate-600">
                  {e.originAddress ?? '—'} {e.originPostalCode ?? ''}
                </td>
                <td className="max-w-[140px] px-3 py-2 text-xs text-slate-600">
                  {e.destinationAddress ?? '—'} {e.destinationPostalCode ?? ''}
                </td>
                <td className="px-3 py-2 text-xs">{e.packageWeightKg != null ? `${e.packageWeightKg} kg` : '—'}</td>
                <td className="max-w-[180px] px-3 py-2 text-xs">
                  <div>{e.senderName ?? '—'}</div>
                  <div className="text-slate-500">{e.recipientName ?? '—'}</div>
                </td>
                <td className="px-3 py-2 text-xs">
                  {e.totalAmountCents != null
                    ? `${(e.totalAmountCents / 100).toFixed(2)} ${e.currency ?? 'EUR'}`
                    : '—'}
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    className="font-semibold text-ldh-orange hover:underline"
                    onClick={() => openDetail(e)}
                  >
                    Detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pageItems.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">
            No hay envíos que coincidan con los filtros.
          </p>
        ) : null}
      </div>

      {filteredItems.length > pageSize ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <p className="text-sm text-slate-600">
            Página <span className="font-semibold text-ldh-navy">{page}</span> de{' '}
            <span className="font-semibold text-ldh-navy">{totalPages}</span>
            <span className="text-slate-500">
              {' '}
              · filas {(page - 1) * pageSize + 1}–{(page - 1) * pageSize + pageItems.length}
            </span>
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

      {detail ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-slate-900/50" aria-label="Cerrar" onClick={closeDetail} />
          <div className="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-ldh-navy">Envío {detail.trackingNumber}</h2>
                <p className="text-xs text-slate-500">ID #{detail.id}</p>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                aria-label="Cerrar"
              >
                <span className="text-xl leading-none">×</span>
              </button>
            </div>

            {detailError ? (
              <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{detailError}</div>
            ) : null}

            <div className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
              <p>
                <span className="font-semibold text-slate-900">Cliente:</span> {detail.clientEmail}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Estado actual:</span> {statusLabel[detail.status]}
              </p>
            </div>

            {detail.status === 'EXCEPTION' || adminStatus === 'EXCEPTION' ? (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
                <p className="font-bold text-amber-950">Incidencia</p>
                {detail.exceptionReason ? (
                  <p className="mt-1">
                    <span className="font-semibold">Motivo:</span> {detail.exceptionReason}
                  </p>
                ) : null}
                {detail.exceptionNotes ? (
                  <p className="mt-2 whitespace-pre-wrap text-slate-800">{detail.exceptionNotes}</p>
                ) : (
                  <p className="mt-1 text-slate-600">Sin notas adicionales registradas.</p>
                )}
              </div>
            ) : null}

            <div className="mt-6 border-t border-slate-100 pt-4">
              <h3 className="text-sm font-bold uppercase tracking-wide text-ldh-navy">Cambiar estado (admin)</h3>
              <div className="mt-3 space-y-3">
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={adminStatus}
                  onChange={(ev) => setAdminStatus(ev.target.value as EnvioStatus)}
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {statusLabel[s]}
                    </option>
                  ))}
                </select>
                {adminStatus === 'EXCEPTION' ? (
                  <>
                    <input
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Motivo de la incidencia *"
                      value={adminExceptionReason}
                      onChange={(ev) => setAdminExceptionReason(ev.target.value)}
                    />
                    <textarea
                      className="min-h-[80px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Notas internas (opcional)"
                      value={adminExceptionNotes}
                      onChange={(ev) => setAdminExceptionNotes(ev.target.value)}
                    />
                  </>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={detailBusy}
                    onClick={() => void saveAdminStatus()}
                    className="rounded-lg bg-ldh-orange px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Guardar estado
                  </button>
                  <button
                    type="button"
                    disabled={detailBusy}
                    onClick={() => void handleDownloadFactura()}
                    className="rounded-lg border border-ldh-navy px-4 py-2 text-sm font-semibold text-ldh-navy disabled:opacity-50"
                  >
                    Descargar factura PDF
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-4">
              <h3 className="text-sm font-bold uppercase tracking-wide text-ldh-navy">Auditoría de estados</h3>
              {auditLoading ? (
                <p className="mt-2 text-sm text-slate-500">Cargando historial…</p>
              ) : audit && audit.length > 0 ? (
                <ul className="mt-3 space-y-3 text-sm">
                  {audit.map((a) => (
                    <li key={a.id} className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
                      <p className="font-medium text-ldh-navy">
                        {a.oldStatus != null ? `${statusLabel[a.oldStatus] ?? a.oldStatus} → ` : ''}
                        {statusLabel[a.newStatus] ?? a.newStatus}
                      </p>
                      <p className="text-xs text-slate-600">
                        {formatTrackingDateTime(new Date(a.changedAt))}
                        {a.actorEmail ? ` · ${a.actorEmail}` : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">Aún no hay cambios de estado registrados.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
