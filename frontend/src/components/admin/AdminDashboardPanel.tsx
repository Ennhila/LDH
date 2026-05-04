import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useRequireRole } from '../../hooks/use-require-role';
import { apiFetch } from '../../lib/api';
import type { AdminDashboardCharts, DashboardStats } from '../../types/api';

const PIE_COLORS = ['#2d3e8b', '#ff6600', '#1e2a5e', '#64748b', '#fdb813', '#94a3b8'];

const statusLabel: Record<string, string> = {
  PENDING: 'Pendiente',
  PICKED_UP: 'Recogido',
  IN_TRANSIT: 'En tránsito',
  OUT_FOR_DELIVERY: 'En reparto',
  DELIVERED: 'Entregado',
  EXCEPTION: 'Incidencia',
};

export default function AdminDashboardPanel() {
  const { me, loading: authLoading } = useRequireRole('ADMIN');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<AdminDashboardCharts | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!me) return;
    let cancel = false;
    setStatsLoading(true);
    setError(null);
    (async () => {
      try {
        const [s, c] = await Promise.all([
          apiFetch<DashboardStats>('/api/admin/dashboard/stats'),
          apiFetch<AdminDashboardCharts>('/api/admin/dashboard/charts'),
        ]);
        if (cancel) return;
        if (s == null || typeof s !== 'object') {
          setStats(null);
          setCharts(null);
          setError('Respuesta inválida del servidor (estadísticas vacías).');
          return;
        }
        if (typeof s.repartidoresTotal !== 'number' || s.envios == null || s.ingresosCents == null) {
          setStats(null);
          setCharts(null);
          setError(
            'El servidor devolvió un formato inesperado. Comprueba que PUBLIC_API_URL apunte al backend y que estés en la misma red.',
          );
          return;
        }
        setStats(s);
        setCharts(c);
      } catch (e) {
        if (!cancel) {
          setStats(null);
          setCharts(null);
          setError(
            e instanceof Error
              ? e.message
              : 'No se pudieron cargar las estadísticas. ¿Está arrancado el backend y PUBLIC_API_URL bien configurada?',
          );
        }
      } finally {
        if (!cancel) setStatsLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [me]);

  if (authLoading || !me) {
    return <p className="text-slate-600">Cargando…</p>;
  }
  if (statsLoading) {
    return <p className="text-slate-600">Cargando estadísticas…</p>;
  }
  if (error) {
    return (
      <div className="space-y-2">
        <p className="text-red-600">{error}</p>
        <p className="text-sm text-slate-600">
          En desarrollo local el API suele ser <code className="rounded bg-slate-100 px-1">http://localhost:8080</code>.
          Define <code className="rounded bg-slate-100 px-1">PUBLIC_API_URL</code> al construir el frontend si el
          backend está en otro host.
        </p>
      </div>
    );
  }
  if (!stats) {
    return <p className="text-red-600">No hay estadísticas para mostrar.</p>;
  }

  const envioData = [
    { periodo: '7 días', envíos: stats.envios.last7Days },
    { periodo: '30 días', envíos: stats.envios.last30Days },
    { periodo: '90 días', envíos: stats.envios.last90Days },
  ];
  const moneyData = [
    { periodo: '7 días', ingresos: Math.round(stats.ingresosCents.last7Days / 100) },
    { periodo: '30 días', ingresos: Math.round(stats.ingresosCents.last30Days / 100) },
    { periodo: '90 días', ingresos: Math.round(stats.ingresosCents.last90Days / 100) },
  ];

  const statusPieData =
    charts?.enviosByStatus.map((row) => ({
      ...row,
      name: statusLabel[row.status] ?? row.status,
    })) ?? [];

  const createdLineData =
    charts?.enviosCreatedByDay.map((d) => ({
      ...d,
      label: d.date.slice(5),
    })) ?? [];

  const ingresosLineData =
    charts?.ingresosDeliveredByDay.map((d) => ({
      ...d,
      label: d.date.slice(5),
      euros: Math.round(d.amountCents / 100),
    })) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ldh-navy">Dashboard</h1>
        <p className="text-slate-600">Resumen operativo e ingresos de envíos entregados (últimos periodos).</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Repartidores</p>
          <p className="mt-1 text-2xl font-bold text-ldh-navy">{stats.repartidoresTotal}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Turno activo</p>
          <p className="mt-1 text-2xl font-bold text-ldh-orange">{stats.repartidoresActivos}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Oficinas</p>
          <p className="mt-1 text-2xl font-bold text-ldh-navy">{stats.oficinasTotal}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Envíos 30 días</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{stats.envios.last30Days}</p>
        </div>
      </div>

      {charts ? (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
            <h2 className="mb-2 font-semibold text-ldh-navy">Envíos creados por día (30 días)</h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={createdLineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip labelFormatter={(_, p) => (p[0]?.payload?.date as string) ?? ''} />
                  <Line type="monotone" dataKey="count" stroke="#2d3e8b" strokeWidth={2} dot={{ r: 3 }} name="Envíos" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-2 font-semibold text-ldh-navy">Por estado</h2>
            {/* In Recharts, the label callback for a <Pie /> does not receive count directly as a top-level prop */}
            {/* i need to debugg this after */}
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={88}
                    label={({ name, count }) => `${name}: ${count}`}
                  >
                    {statusPieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:col-span-3">
            <h2 className="mb-2 font-semibold text-ldh-navy">Ingresos por día — entregados (30 días, €)</h2>
            <p className="mb-2 text-xs text-slate-500">
              Suma de <code className="rounded bg-slate-100 px-1">totalAmountCents</code> por fecha de última
              actualización del envío en estado entregado.
            </p>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ingresosLineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip
                    formatter={(v: number) => [`${v} €`, 'Ingresos']}
                    labelFormatter={(_, p) => (p[0]?.payload?.date as string) ?? ''}
                  />
                  <Bar dataKey="euros" fill="#ff6600" radius={[6, 6, 0, 0]} name="€" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 font-semibold text-ldh-navy">Envíos creados (resumen)</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={envioData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="periodo" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="envíos" fill="#2d3e8b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 font-semibold text-ldh-navy">Ingresos (€) — entregados (resumen)</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moneyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="periodo" />
                <YAxis />
                <Tooltip formatter={(v: number) => [`${v} €`, 'Aprox.']} />
                <Bar dataKey="ingresos" fill="#ff6600" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <p className="text-xs text-slate-500">
        Nota: los gráficos de ingresos usan totales en céntimos de pedidos con estado ENTREGADO. Ajusta reglas de negocio
        en backend si necesitas facturación distinta.
      </p>
    </div>
  );
}
