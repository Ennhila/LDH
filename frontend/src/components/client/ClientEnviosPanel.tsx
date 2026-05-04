import { useEffect, useState } from 'react';
import { useRequireRole } from '../../hooks/use-require-role';
import { apiFetch } from '../../lib/api';
import { downloadEnvioFacturaPdf } from '../../lib/pdf/envio-factura-simple';
import type { Envio } from '../../types/api';

const statusLabel: Record<string, string> = {
  PENDING: 'Pendiente',
  PICKED_UP: 'Recogido',
  IN_TRANSIT: 'En tránsito',
  OUT_FOR_DELIVERY: 'En reparto',
  DELIVERED: 'Entregado',
  EXCEPTION: 'Incidencia',
};

export default function ClientEnviosPanel() {
  const { me, loading: authLoading } = useRequireRole('CLIENTE');
  const [items, setItems] = useState<Envio[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!me) return;
    let cancel = false;
    (async () => {
      try {
        const list = await apiFetch<Envio[]>('/api/client/envios');
        if (!cancel) setItems(list);
      } catch (e) {
        if (!cancel) setError(e instanceof Error ? e.message : 'Error');
      }
    })();
    return () => {
      cancel = true;
    };
  }, [me]);

  if (authLoading || !me) return <p className="text-slate-600">Cargando…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-ldh-navy">Mis envíos</h1>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-[720px] w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Seguimiento</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Creado</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((e) => (
              <tr key={e.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-mono text-xs">{e.trackingNumber}</td>
                <td className="px-3 py-2">{statusLabel[e.status] ?? e.status}</td>
                <td className="px-3 py-2 text-xs text-slate-600">{new Date(e.createdAt).toLocaleString('es-ES')}</td>
                <td className="px-3 py-2 text-xs">
                  {e.totalAmountCents != null
                    ? `${(e.totalAmountCents / 100).toFixed(2)} ${e.currency ?? 'EUR'}`
                    : '—'}
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    className="text-sm font-semibold text-ldh-orange hover:underline"
                    onClick={() => downloadEnvioFacturaPdf(e)}
                  >
                    Factura PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
