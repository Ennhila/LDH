import { useEffect, useState } from 'react';
import { useRequireRole } from '../../hooks/use-require-role';
import { apiFetch } from '../../lib/api';
import type { Oficina } from '../../types/api';
import OficinasMap from '../maps/OficinasMap';

export default function ClientOficinasPanel() {
  const { me, loading: authLoading } = useRequireRole('CLIENTE');
  const [items, setItems] = useState<Oficina[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!me) return;
    let cancel = false;
    (async () => {
      try {
        const list = await apiFetch<Oficina[]>('/api/public/oficinas', { skipAuth: true });
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ldh-navy">Oficinas</h1>
        <p className="text-slate-600">Mapa de puntos LDH (datos públicos).</p>
      </div>
      <OficinasMap oficinas={items} height="480px" />
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((o) => (
          <li key={o.id} className="rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-sm">
            <p className="font-semibold text-ldh-navy">{o.name}</p>
            <p className="mt-1 text-slate-600">
              {o.addressLine}, {o.postalCode} {o.city}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
