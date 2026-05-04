import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRequireRole } from '../../hooks/use-require-role';
import { apiFetch } from '../../lib/api';
import { downloadPriceMatrixCsv } from '../../lib/pricing-api';
import type { DeliveryModifierDto, DeliveryTypeCode, PriceMatrixCellDto } from '../../types/api';

const PILL_LABELS: { code: DeliveryTypeCode; label: string }[] = [
  { code: 'OFFICE_OFFICE', label: 'Oficina→Oficina' },
  { code: 'OFFICE_HOME', label: 'Oficina→Domicilio' },
  { code: 'HOME_OFFICE', label: 'Domicilio→Oficina' },
  { code: 'HOME_HOME', label: 'Domicilio→Domicilio' },
];

function displayPrice(c: PriceMatrixCellDto, mod: DeliveryModifierDto | undefined): number {
  if (!mod) return c.basePrice;
  const sub = c.basePrice + (c.fuelSurcharge ?? 0) + (c.remoteAreaSurcharge ?? 0);
  return Math.round((sub * mod.multiplier + mod.flatSurcharge) * 100) / 100;
}

function heatBg(value: number, min: number, max: number): string {
  if (max <= min) return 'rgb(240,253,244)';
  const t = (value - min) / (max - min);
  const r = Math.round(220 + t * 35);
  const g = Math.round(252 - t * 120);
  const b = Math.round(231 - t * 80);
  return `rgb(${r},${g},${b})`;
}

export default function AdminPriceMatrixPanel() {
  const { me, loading: authLoading } = useRequireRole('ADMIN');
  const [tab, setTab] = useState<'matrix' | 'modifiers'>('matrix');
  const [cells, setCells] = useState<PriceMatrixCellDto[]>([]);
  const [modifiers, setModifiers] = useState<DeliveryModifierDto[]>([]);
  const [pill, setPill] = useState<DeliveryTypeCode>('OFFICE_OFFICE');
  const [error, setError] = useState<string | null>(null);
  const [edit, setEdit] = useState<PriceMatrixCellDto | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkPrice, setBulkPrice] = useState('');

  const modByCode = useMemo(() => new Map(modifiers.map((m) => [m.code, m])), [modifiers]);
  const activeMod = modByCode.get(pill);

  const zoneIds = useMemo(() => {
    const s = new Set<number>();
    cells.forEach((c) => {
      s.add(c.originZoneId);
      s.add(c.destZoneId);
    });
    return Array.from(s).sort((a, b) => a - b);
  }, [cells]);

  const codeById = useMemo(() => {
    const m = new Map<number, string>();
    cells.forEach((c) => {
      m.set(c.originZoneId, c.originZoneCode);
      m.set(c.destZoneId, c.destZoneCode);
    });
    return m;
  }, [cells]);

  const cellByPair = useMemo(() => {
    const m = new Map<string, PriceMatrixCellDto>();
    cells.forEach((c) => m.set(`${c.originZoneId}-${c.destZoneId}`, c));
    return m;
  }, [cells]);

  const displayValues = useMemo(() => {
    return zoneIds.flatMap((o) =>
      zoneIds.map((d) => {
        const c = cellByPair.get(`${o}-${d}`);
        if (!c) return 0;
        return displayPrice(c, activeMod);
      }),
    );
  }, [zoneIds, cellByPair, activeMod]);

  const { minP, maxP } = useMemo(() => {
    const v = displayValues.filter((x) => x > 0);
    if (!v.length) return { minP: 0, maxP: 1 };
    return { minP: Math.min(...v), maxP: Math.max(...v) };
  }, [displayValues]);

  const refresh = useCallback(async () => {
    const [m, c] = await Promise.all([
      apiFetch<DeliveryModifierDto[]>('/api/admin/prices/delivery-modifiers'),
      apiFetch<PriceMatrixCellDto[]>('/api/admin/prices/matrix'),
    ]);
    setModifiers(m);
    setCells(c);
  }, []);

  useEffect(() => {
    if (!me) return;
    refresh().catch((e) => setError(e instanceof Error ? e.message : 'Error'));
  }, [me, refresh]);

  async function saveCell() {
    if (!edit) return;
    setError(null);
    try {
      await apiFetch(`/api/admin/prices/matrix/cells/${edit.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          basePrice: edit.basePrice,
          pricePerKgOver1: edit.pricePerKgOver1,
          pricePerKgOver5: edit.pricePerKgOver5,
          pricePerKgOver20: edit.pricePerKgOver20,
          fuelSurcharge: edit.fuelSurcharge,
          remoteAreaSurcharge: edit.remoteAreaSurcharge,
          validFrom: edit.validFrom || null,
          validTo: edit.validTo || null,
          active: edit.active,
        }),
      });
      setEdit(null);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }

  async function saveModifier(m: DeliveryModifierDto) {
    setError(null);
    try {
      await apiFetch(`/api/admin/prices/delivery-modifiers/${m.code}`, {
        method: 'PATCH',
        body: JSON.stringify({
          multiplier: m.multiplier,
          flatSurcharge: m.flatSurcharge,
          active: m.active,
          label: m.label,
        }),
      });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }

  async function applyBulk() {
    const price = Number(bulkPrice);
    if (!Number.isFinite(price) || selected.size === 0) return;
    setError(null);
    const bulkCells = Array.from(selected)
      .map((id) => cells.find((c) => c.id === id))
      .filter(Boolean)
      .map((c) => ({ originZoneId: c!.originZoneId, destZoneId: c!.destZoneId, basePrice: price }));
    try {
      await apiFetch('/api/admin/prices/matrix/bulk', {
        method: 'POST',
        body: JSON.stringify({ cells: bulkCells }),
      });
      setSelected(new Set());
      setBulkPrice('');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }

  function toggleSelect(cellId: number) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(cellId)) n.delete(cellId);
      else n.add(cellId);
      return n;
    });
  }

  if (authLoading || !me) return <p className="text-slate-600">Cargando…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ldh-navy">Matriz de precios</h1>
        <p className="mt-1 text-slate-600">
          Precio base por par de zonas (referencia oficina→oficina). Píldoras de tipo de entrega recalculan en tiempo
          real. Celdas oscuras = mayor precio mostrado.
        </p>
      </div>
      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>}

      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          className={`rounded-md px-4 py-2 text-sm font-semibold ${tab === 'matrix' ? 'bg-ldh-navy text-white' : 'bg-slate-100'}`}
          onClick={() => setTab('matrix')}
        >
          Precios base por zona
        </button>
        <button
          type="button"
          className={`rounded-md px-4 py-2 text-sm font-semibold ${tab === 'modifiers' ? 'bg-ldh-navy text-white' : 'bg-slate-100'}`}
          onClick={() => setTab('modifiers')}
        >
          Modificadores de entrega
        </button>
      </div>

      {tab === 'matrix' && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase text-slate-500">Tipo de entrega (vista)</span>
            {PILL_LABELS.map((p) => (
              <button
                key={p.code}
                type="button"
                onClick={() => setPill(p.code)}
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  pill === p.code ? 'bg-ldh-orange text-white' : 'bg-slate-200 text-slate-800'
                }`}
              >
                {p.label}
              </button>
            ))}
            <button
              type="button"
              className="ml-auto text-sm font-semibold text-ldh-navy underline"
              onClick={() => downloadPriceMatrixCsv(pill).catch((e) => setError(e instanceof Error ? e.message : 'Error'))}
            >
              Exportar CSV
            </button>
          </div>

          <div className="flex flex-wrap items-end gap-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
            <div>
              <label className="block text-xs font-semibold text-amber-900">Actualización masiva (precio base)</label>
              <input
                type="number"
                step="0.01"
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
                className="mt-1 rounded border border-amber-300 px-2 py-1 text-sm"
                placeholder="€"
              />
            </div>
            <button
              type="button"
              disabled={!selected.size}
              onClick={() => void applyBulk()}
              className="rounded-md bg-amber-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Aplicar a {selected.size} celdas
            </button>
            <span className="text-xs text-amber-900">Marca celdas con clic + Ctrl/selección múltiple</span>
          </div>

          <div className="max-h-[70vh] overflow-auto rounded-lg border border-slate-200 bg-white">
            <table className="border-collapse text-xs">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-white px-1 py-1 text-left shadow-sm">O \\ D</th>
                  {zoneIds.map((d) => (
                    <th key={d} className="min-w-[52px] px-0.5 py-1 text-center font-mono text-[10px]">
                      {(codeById.get(d) ?? '').replace('ZONE_INTL_', '').slice(0, 6)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {zoneIds.map((o) => (
                  <tr key={o}>
                    <td className="sticky left-0 z-10 bg-white px-1 py-0.5 font-mono text-[10px] shadow-sm">
                      {(codeById.get(o) ?? '').replace('ZONE_', '').slice(0, 8)}
                    </td>
                    {zoneIds.map((d) => {
                      const c = cellByPair.get(`${o}-${d}`);
                      if (!c) return <td key={d} className="border border-slate-100" />;
                      const shown = displayPrice(c, activeMod);
                      const bg = heatBg(shown, minP, maxP);
                      const sel = selected.has(c.id);
                      return (
                        <td
                          key={d}
                          className={`cursor-pointer border border-slate-100 px-0.5 py-0.5 text-center ${sel ? 'ring-2 ring-ldh-orange' : ''}`}
                          style={{ backgroundColor: bg }}
                          title={`${c.originZoneCode} → ${c.destZoneCode}: ${shown.toFixed(2)} €`}
                          onClick={(e) => {
                            if (e.ctrlKey || e.metaKey) toggleSelect(c.id);
                            else setEdit({ ...c });
                          }}
                        >
                          {shown.toFixed(1)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'modifiers' && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Multiplicador</th>
                <th className="px-3 py-2">Recargo fijo €</th>
                <th className="px-3 py-2">Activo</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {modifiers.map((m) => (
                <tr key={m.code} className="border-t border-slate-100">
                  <td className="px-3 py-2">{m.label}</td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.0001"
                      value={m.multiplier}
                      onChange={(e) =>
                        setModifiers((list) =>
                          list.map((x) => (x.code === m.code ? { ...x, multiplier: Number(e.target.value) } : x)),
                        )
                      }
                      className="w-24 rounded border px-2 py-1"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.01"
                      value={m.flatSurcharge}
                      onChange={(e) =>
                        setModifiers((list) =>
                          list.map((x) => (x.code === m.code ? { ...x, flatSurcharge: Number(e.target.value) } : x)),
                        )
                      }
                      className="w-24 rounded border px-2 py-1"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={m.active}
                      onChange={(e) =>
                        setModifiers((list) =>
                          list.map((x) => (x.code === m.code ? { ...x, active: e.target.checked } : x)),
                        )
                      }
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      className="text-ldh-navy hover:underline"
                      onClick={() => void saveModifier(m)}
                    >
                      Guardar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {edit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-ldh-navy">
              Editar celda {edit.originZoneCode} → {edit.destZoneCode}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Base oficina→oficina. El total al cliente incluye multiplicador y recargo del tipo de entrega activo en la
              pestaña de modificadores.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-xs">
                Precio base €
                <input
                  type="number"
                  step="0.01"
                  value={edit.basePrice}
                  onChange={(e) => setEdit({ ...edit, basePrice: Number(e.target.value) })}
                  className="mt-1 w-full rounded border px-2 py-1"
                />
              </label>
              <label className="text-xs">
                €/kg (1–5 kg)
                <input
                  type="number"
                  step="0.01"
                  value={edit.pricePerKgOver1}
                  onChange={(e) => setEdit({ ...edit, pricePerKgOver1: Number(e.target.value) })}
                  className="mt-1 w-full rounded border px-2 py-1"
                />
              </label>
              <label className="text-xs">
                €/kg (5–20 kg)
                <input
                  type="number"
                  step="0.01"
                  value={edit.pricePerKgOver5}
                  onChange={(e) => setEdit({ ...edit, pricePerKgOver5: Number(e.target.value) })}
                  className="mt-1 w-full rounded border px-2 py-1"
                />
              </label>
              <label className="text-xs">
                €/kg (&gt;20 kg)
                <input
                  type="number"
                  step="0.01"
                  value={edit.pricePerKgOver20}
                  onChange={(e) => setEdit({ ...edit, pricePerKgOver20: Number(e.target.value) })}
                  className="mt-1 w-full rounded border px-2 py-1"
                />
              </label>
              <label className="text-xs">
                Combustible €
                <input
                  type="number"
                  step="0.01"
                  value={edit.fuelSurcharge}
                  onChange={(e) => setEdit({ ...edit, fuelSurcharge: Number(e.target.value) })}
                  className="mt-1 w-full rounded border px-2 py-1"
                />
              </label>
              <label className="text-xs">
                Zona remota €
                <input
                  type="number"
                  step="0.01"
                  value={edit.remoteAreaSurcharge}
                  onChange={(e) => setEdit({ ...edit, remoteAreaSurcharge: Number(e.target.value) })}
                  className="mt-1 w-full rounded border px-2 py-1"
                />
              </label>
              <label className="text-xs">
                Válido desde
                <input
                  type="date"
                  value={edit.validFrom?.slice(0, 10) ?? ''}
                  onChange={(e) => setEdit({ ...edit, validFrom: e.target.value || null })}
                  className="mt-1 w-full rounded border px-2 py-1"
                />
              </label>
              <label className="text-xs">
                Válido hasta
                <input
                  type="date"
                  value={edit.validTo?.slice(0, 10) ?? ''}
                  onChange={(e) => setEdit({ ...edit, validTo: e.target.value || null })}
                  className="mt-1 w-full rounded border px-2 py-1"
                />
              </label>
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={edit.active}
                onChange={(e) => setEdit({ ...edit, active: e.target.checked })}
              />
              Activo
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="rounded border px-4 py-2 text-sm" onClick={() => setEdit(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="rounded bg-ldh-orange px-4 py-2 text-sm font-semibold text-white"
                onClick={() => void saveCell()}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
