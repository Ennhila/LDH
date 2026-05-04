import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useRequireRole } from '../../hooks/use-require-role';
import { apiFetch } from '../../lib/api';
import { isHistorialRepartidorEnvio, sortHistorialEnvios } from '../../lib/repartidor-envios';
import type { Envio, EnvioStatus } from '../../types/api';

const statusLabel: Record<EnvioStatus, string> = {
  PENDING: 'Pendiente',
  PICKED_UP: 'Recogido',
  IN_TRANSIT: 'En tránsito',
  OUT_FOR_DELIVERY: 'En reparto',
  DELIVERED: 'Entregado',
  EXCEPTION: 'Incidencia',
};

function formatUpdated(iso: string): string {
  try {
    return new Date(iso).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function RepartidorHistorialPage() {
  const { me, loading: authLoading } = useRequireRole('REPARTIDOR');
  const [items, setItems] = useState<Envio[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!me) return;
    apiFetch<Envio[]>('/api/repartidor/envios')
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'));
  }, [me]);

  const historial = useMemo(() => {
    const h = items.filter(isHistorialRepartidorEnvio);
    return sortHistorialEnvios(h);
  }, [items]);

  const deliveredCount = useMemo(() => historial.filter((e) => e.status === 'DELIVERED').length, [historial]);
  const exceptionCount = useMemo(() => historial.filter((e) => e.status === 'EXCEPTION').length, [historial]);

  if (authLoading || !me) return <p className="text-slate-600">Cargando…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ldh-navy">Entregados e incidencias</h1>
        <p className="mt-1 text-slate-600">
          Histórico de envíos ya cerrados (entregados o con incidencia). Los envíos activos siguen en{' '}
          <a href="/repartidor" className="font-semibold text-ldh-orange underline hover:no-underline">
            Envíos activos
          </a>
          .
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
          Entregados: {deliveredCount}
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-950">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" aria-hidden />
          Incidencias: {exceptionCount}
        </div>
      </div>

      {error ? <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div> : null}

      {historial.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-slate-600 shadow-sm">
          <p className="font-medium text-slate-800">Aún no hay entregas ni incidencias registradas.</p>
          <p className="mt-2 text-sm">Cuando marques un envío como entregado o incidencia, aparecerá aquí.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[800px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Seguimiento</th>
                  <th className="px-4 py-3">Última actualización</th>
                  <th className="px-4 py-3">Destino</th>
                  <th className="px-4 py-3">Cliente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historial.map((e) => {
                  const delivered = e.status === 'DELIVERED';
                  const rowClass = delivered
                    ? 'bg-emerald-50/80 border-l-4 border-l-emerald-500'
                    : 'bg-red-50/80 border-l-4 border-l-red-500';
                  const badgeClass = delivered
                    ? 'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200'
                    : 'bg-red-100 text-red-950 ring-1 ring-red-200';

                  return (
                    <tr key={e.id} className={rowClass}>
                      <td className="px-4 py-3 align-top">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${badgeClass}`}
                        >
                          {delivered ? (
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                          ) : (
                            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                          )}
                          {statusLabel[e.status]}
                        </span>
                        {e.status === 'EXCEPTION' && e.exceptionReason ? (
                          <p className="mt-2 max-w-xs text-xs text-red-900">
                            <span className="font-semibold">Motivo:</span> {e.exceptionReason}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 align-top font-mono text-xs font-semibold text-slate-900">
                        {e.trackingNumber}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 align-top text-xs text-slate-700">
                        {formatUpdated(e.updatedAt)}
                      </td>
                      <td className="max-w-[220px] px-4 py-3 align-top text-xs text-slate-700">
                        {e.destinationAddress ?? '—'}
                        {e.destinationPostalCode ? (
                          <span className="block text-slate-500">CP {e.destinationPostalCode}</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 align-top text-xs text-slate-600">{e.clientEmail ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
