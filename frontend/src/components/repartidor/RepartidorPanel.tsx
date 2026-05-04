import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScanLine } from 'lucide-react';
import { useRequireRole } from '../../hooks/use-require-role';
import { apiFetch } from '../../lib/api';
import { isActiveRepartidorEnvio, isHistorialRepartidorEnvio } from '../../lib/repartidor-envios';
import { findEnvioByTracking, parseTrackingFromScan } from '../../lib/parse-tracking-scan';
import type { Envio, EnvioStatus } from '../../types/api';
import { RepartidorBarcodeScanner } from './RepartidorBarcodeScanner';
import { RepartidorScanSheet } from './RepartidorScanSheet';

const STATUSES: EnvioStatus[] = [
  'PENDING',
  'PICKED_UP',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'EXCEPTION',
];

const statusLabel: Record<EnvioStatus, string> = {
  PENDING: 'Pendiente',
  PICKED_UP: 'Recogido',
  IN_TRANSIT: 'En tránsito',
  OUT_FOR_DELIVERY: 'En reparto',
  DELIVERED: 'Entregado',
  EXCEPTION: 'Incidencia',
};

export default function RepartidorPanel() {
  const { me, loading: authLoading } = useRequireRole('REPARTIDOR');
  const [items, setItems] = useState<Envio[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyShift, setBusyShift] = useState(false);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [sheetEnvio, setSheetEnvio] = useState<Envio | null>(null);
  const [sheetNotFoundTracking, setSheetNotFoundTracking] = useState<string | null>(null);
  const [busyQuick, setBusyQuick] = useState(false);

  const [edit, setEdit] = useState<{
    id: number;
    status: EnvioStatus;
    lat: string;
    lng: string;
    label: string;
    exceptionReason: string;
    exceptionNotes: string;
  } | null>(null);

  const refresh = useCallback(async (): Promise<Envio[]> => {
    const list = await apiFetch<Envio[]>('/api/repartidor/envios');
    setItems(list);
    return list;
  }, []);

  const handleScanDecoded = useCallback(
    async (raw: string) => {
      setScannerOpen(false);
      const tn = parseTrackingFromScan(raw);
      if (!tn) {
        setError('No se pudo leer el código.');
        return;
      }
      try {
        const list = await refresh();
        const found = findEnvioByTracking(list, tn);
        if (found) {
          setSheetEnvio(found);
          setSheetNotFoundTracking(null);
        } else {
          setSheetEnvio(null);
          setSheetNotFoundTracking(tn);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al cargar envíos.');
      }
    },
    [refresh],
  );

  async function applyQuickStatus(envio: Envio, status: EnvioStatus) {
    if (status === 'EXCEPTION') {
      setSheetEnvio(null);
      setEdit({
        id: envio.id,
        status: 'EXCEPTION',
        lat: envio.currentLatitude != null ? String(envio.currentLatitude) : '',
        lng: envio.currentLongitude != null ? String(envio.currentLongitude) : '',
        label: envio.lastLocationLabel ?? '',
        exceptionReason: envio.exceptionReason ?? '',
        exceptionNotes: envio.exceptionNotes ?? '',
      });
      return;
    }
    setBusyQuick(true);
    setError(null);
    try {
      await apiFetch(`/api/repartidor/envios/${envio.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          currentLatitude: envio.currentLatitude,
          currentLongitude: envio.currentLongitude,
          lastLocationLabel: envio.lastLocationLabel,
          exceptionReason: null,
          exceptionNotes: null,
        }),
      });
      setSheetEnvio(null);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusyQuick(false);
    }
  }

  async function retryScanLookup() {
    if (!sheetNotFoundTracking) return;
    const tn = sheetNotFoundTracking;
    setError(null);
    try {
      const list = await refresh();
      const found = findEnvioByTracking(list, tn);
      if (found) {
        setSheetNotFoundTracking(null);
        setSheetEnvio(found);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }

  useEffect(() => {
    if (!me) return;
    refresh().catch((e) => setError(e instanceof Error ? e.message : 'Error'));
  }, [me, refresh]);

  const activeItems = useMemo(() => items.filter(isActiveRepartidorEnvio), [items]);
  const historialCount = useMemo(() => items.filter(isHistorialRepartidorEnvio).length, [items]);

  async function startShift() {
    setBusyShift(true);
    setError(null);
    try {
      await apiFetch('/api/repartidor/shift/start', { method: 'POST' });
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusyShift(false);
    }
  }

  async function endShift() {
    setBusyShift(true);
    setError(null);
    try {
      await apiFetch('/api/repartidor/shift/end', { method: 'POST' });
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusyShift(false);
    }
  }

  async function submitStatus() {
    if (!edit) return;
    if (edit.status === 'EXCEPTION' && !edit.exceptionReason.trim()) {
      setError('Indica un motivo de incidencia.');
      return;
    }
    setError(null);
    try {
      await apiFetch(`/api/repartidor/envios/${edit.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: edit.status,
          currentLatitude: edit.lat ? Number(edit.lat) : null,
          currentLongitude: edit.lng ? Number(edit.lng) : null,
          lastLocationLabel: edit.label.trim() || null,
          exceptionReason: edit.status === 'EXCEPTION' ? edit.exceptionReason.trim() : null,
          exceptionNotes: edit.status === 'EXCEPTION' ? edit.exceptionNotes.trim() || null : null,
        }),
      });
      setEdit(null);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }

  if (authLoading || !me) return <p className="text-slate-600">Cargando…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ldh-navy">Envíos activos</h1>
          <p className="text-slate-600">
            Turno:{' '}
            <strong>{me.shiftActive ? 'activo' : 'inactivo'}</strong> — al iniciar turno el admin verá el repartidor como
            activo.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-800">
              Activos: {activeItems.length}
            </span>
            <a
              href="/repartidor/historial"
              className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-ldh-navy shadow-sm transition hover:border-ldh-orange hover:text-ldh-orange"
            >
              Ver entregados e incidencias
              {historialCount > 0 ? (
                <span className="ml-1 rounded-full bg-slate-200 px-1.5 py-0.5 text-xs text-slate-800">{historialCount}</span>
              ) : null}
            </a>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setScannerOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-md bg-ldh-orange px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-ldh-orange-hover"
          >
            <ScanLine className="h-4 w-4" aria-hidden />
            Escanear paquete
          </button>
          <button
            type="button"
            disabled={busyShift || me.shiftActive}
            onClick={startShift}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Iniciar turno
          </button>
          <button
            type="button"
            disabled={busyShift || !me.shiftActive}
            onClick={endShift}
            className="rounded-md bg-slate-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Finalizar turno
          </button>
        </div>
      </div>
      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-[900px] w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Seguimiento</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Ubicación</th>
              <th className="px-3 py-2">Cliente</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {activeItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-600">
                  No tienes envíos activos en este momento. Los entregados y las incidencias están en{' '}
                  <a href="/repartidor/historial" className="font-semibold text-ldh-orange underline">
                    Entregados e incidencias
                  </a>
                  .
                </td>
              </tr>
            ) : null}
            {activeItems.map((e) => (
              <tr key={e.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-mono text-xs">{e.trackingNumber}</td>
                <td className="px-3 py-2">{statusLabel[e.status]}</td>
                <td className="max-w-[200px] px-3 py-2 text-xs text-slate-600">
                  {e.lastLocationLabel ?? '—'}
                  {e.currentLatitude != null && e.currentLongitude != null && (
                    <div className="text-[10px] text-slate-400">
                      {e.currentLatitude.toFixed(4)}, {e.currentLongitude.toFixed(4)}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 text-xs">{e.clientEmail}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    className="text-ldh-orange font-semibold hover:underline"
                    onClick={() =>
                      setEdit({
                        id: e.id,
                        status: e.status,
                        lat: e.currentLatitude != null ? String(e.currentLatitude) : '',
                        lng: e.currentLongitude != null ? String(e.currentLongitude) : '',
                        label: e.lastLocationLabel ?? '',
                        exceptionReason: e.exceptionReason ?? '',
                        exceptionNotes: e.exceptionNotes ?? '',
                      })
                    }
                  >
                    Actualizar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {scannerOpen ? (
        <RepartidorBarcodeScanner onDecoded={handleScanDecoded} onClose={() => setScannerOpen(false)} />
      ) : null}

      {sheetEnvio ? (
        <RepartidorScanSheet
          envio={sheetEnvio}
          busy={busyQuick}
          onClose={() => setSheetEnvio(null)}
          onPickStatus={(s) => void applyQuickStatus(sheetEnvio, s)}
        />
      ) : null}

      {sheetNotFoundTracking ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[85] bg-black/40 backdrop-blur-[1px]"
            aria-label="Cerrar"
            onClick={() => setSheetNotFoundTracking(null)}
          />
          <div className="fixed inset-x-0 bottom-0 z-[90] max-h-[85vh] animate-[sheet-up_0.28s_ease-out] rounded-t-2xl border border-slate-200 bg-white p-6 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
            <div className="mx-auto max-w-lg">
              <p className="text-lg font-bold text-ldh-navy">Envío no encontrado</p>
              <p className="mt-2 text-sm text-slate-600">
                No aparece ningún envío con seguimiento{' '}
                <span className="font-mono font-semibold">{sheetNotFoundTracking}</span> en el sistema (lista actualizada).
                Si la etiqueta es de una prueba local, el envío debe existir en la misma base de datos tras crearlo en la web.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  className="rounded-xl bg-ldh-navy px-4 py-3 text-sm font-semibold text-white"
                  onClick={() => void retryScanLookup()}
                >
                  Actualizar lista y buscar de nuevo
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
                  onClick={() => setSheetNotFoundTracking(null)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
          <style>{`
            @keyframes sheet-up {
              from { transform: translateY(100%); opacity: 0.85; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}</style>
        </>
      ) : null}

      {edit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-ldh-navy">Actualizar envío</h2>
            <p className="text-xs text-slate-500">ID interno #{edit.id}</p>
            <label className="mt-4 block text-sm font-medium">Estado</label>
            <select
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              value={edit.status}
              onChange={(ev) =>
                setEdit({ ...edit, status: ev.target.value as EnvioStatus })
              }
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabel[s]}
                </option>
              ))}
            </select>
            <label className="mt-3 block text-sm font-medium">Latitud</label>
            <input
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              value={edit.lat}
              onChange={(ev) => setEdit({ ...edit, lat: ev.target.value })}
            />
            <label className="mt-3 block text-sm font-medium">Longitud</label>
            <input
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              value={edit.lng}
              onChange={(ev) => setEdit({ ...edit, lng: ev.target.value })}
            />
            <label className="mt-3 block text-sm font-medium">Descripción ubicación</label>
            <input
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              placeholder="Ej: Centro logistico Madrid"
              value={edit.label}
              onChange={(ev) => setEdit({ ...edit, label: ev.target.value })}
            />
            {edit.status === 'EXCEPTION' ? (
              <>
                <label className="mt-3 block text-sm font-medium">Motivo incidencia *</label>
                <input
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  value={edit.exceptionReason}
                  onChange={(ev) => setEdit({ ...edit, exceptionReason: ev.target.value })}
                />
                <label className="mt-3 block text-sm font-medium">Notas (opcional)</label>
                <textarea
                  className="mt-1 min-h-[72px] w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  value={edit.exceptionNotes}
                  onChange={(ev) => setEdit({ ...edit, exceptionNotes: ev.target.value })}
                />
              </>
            ) : null}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="rounded-md border border-slate-200 px-4 py-2 text-sm" onClick={() => setEdit(null)}>
                Cancelar
              </button>
              <button type="button" className="rounded-md bg-ldh-orange px-4 py-2 text-sm font-semibold text-white" onClick={submitStatus}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
