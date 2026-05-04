import { useState } from 'react';
import { useRequireRole } from '../../hooks/use-require-role';
import { apiFetch } from '../../lib/api';
import type { Envio } from '../../types/api';

const statusLabel: Record<string, string> = {
  PENDING: 'Pendiente',
  PICKED_UP: 'Recogido',
  IN_TRANSIT: 'En tránsito',
  OUT_FOR_DELIVERY: 'En reparto',
  DELIVERED: 'Entregado',
  EXCEPTION: 'Incidencia',
};

export default function ClientSeguimientoPanel() {
  const { me, loading: authLoading } = useRequireRole('CLIENTE');
  const [code, setCode] = useState('');
  const [envio, setEnvio] = useState<Envio | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnvio(null);
    try {
      const path = `/api/public/envios/track/${encodeURIComponent(code.trim())}`;
      const data = await apiFetch<Envio>(path, { skipAuth: true });
      setEnvio(data);
    } catch {
      setError('No encontramos ese número de seguimiento.');
    }
  }

  if (authLoading || !me) return <p className="text-slate-600">Cargando…</p>;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-ldh-navy">Seguimiento</h1>
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          required
          placeholder="Ej: LDH-XXXX-YYYY"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm font-mono"
        />
        <button type="submit" className="rounded-md bg-ldh-navy px-4 py-2 text-sm font-semibold text-white">
          Buscar
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {envio && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-sm">
          <p className="font-mono text-lg font-bold text-ldh-navy">{envio.trackingNumber}</p>
          <p className="mt-2">
            <span className="text-slate-500">Estado:</span>{' '}
            <strong>{statusLabel[envio.status] ?? envio.status}</strong>
          </p>
          {envio.lastLocationLabel && (
            <p className="mt-2 text-slate-700">
              <span className="text-slate-500">Ubicación:</span> {envio.lastLocationLabel}
            </p>
          )}
          <p className="mt-2 text-xs text-slate-500">Actualizado: {new Date(envio.updatedAt).toLocaleString('es-ES')}</p>
        </div>
      )}
    </div>
  );
}
