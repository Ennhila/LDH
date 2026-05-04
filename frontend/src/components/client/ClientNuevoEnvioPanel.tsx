import { useState } from 'react';
import { useRequireRole } from '../../hooks/use-require-role';
import { apiFetch } from '../../lib/api';
import type { Envio } from '../../types/api';

export default function ClientNuevoEnvioPanel() {
  const { me, loading: authLoading } = useRequireRole('CLIENTE');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Envio | null>(null);
  const [form, setForm] = useState({
    originAddress: '',
    originPostalCode: '',
    destinationAddress: '',
    destinationPostalCode: '',
    packageWeightKg: '',
    senderName: '',
    senderPhone: '',
    recipientName: '',
    recipientPhone: '',
    totalAmountCents: '',
    notes: '',
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!me) return;
    setError(null);
    setDone(null);
    try {
      const body = {
        originAddress: form.originAddress.trim() || null,
        originPostalCode: form.originPostalCode.trim() || null,
        destinationAddress: form.destinationAddress.trim() || null,
        destinationPostalCode: form.destinationPostalCode.trim(),
        packageWeightKg: form.packageWeightKg ? Number(form.packageWeightKg) : null,
        senderName: form.senderName.trim() || null,
        senderPhone: form.senderPhone.trim() || null,
        recipientName: form.recipientName.trim() || null,
        recipientPhone: form.recipientPhone.trim() || null,
        totalAmountCents: form.totalAmountCents ? Number(form.totalAmountCents) : null,
        notes: form.notes.trim() || null,
      };
      const envio = await apiFetch<Envio>('/api/client/envios', { method: 'POST', body: JSON.stringify(body) });
      setDone(envio);
      setForm({
        originAddress: '',
        originPostalCode: '',
        destinationAddress: '',
        destinationPostalCode: '',
        packageWeightKg: '',
        senderName: '',
        senderPhone: '',
        recipientName: '',
        recipientPhone: '',
        totalAmountCents: '',
        notes: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }

  if (authLoading || !me) return <p className="text-slate-600">Cargando…</p>;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ldh-navy">Nuevo envío</h1>
        <p className="text-slate-600">
          Formulario conectado al API. Para el flujo visual completo usa el{' '}
          <a href="/envio/paso-1" className="font-semibold text-ldh-orange hover:underline">
            asistente de envío
          </a>
          .
        </p>
      </div>
      {done && (
        <div className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Creado: <strong className="font-mono">{done.trackingNumber}</strong>
        </div>
      )}
      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <input
          placeholder="Dirección origen (opcional)"
          value={form.originAddress}
          onChange={(e) => setForm((f) => ({ ...f, originAddress: e.target.value }))}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
        />
        <input
          placeholder="CP origen (opcional)"
          value={form.originPostalCode}
          onChange={(e) => setForm((f) => ({ ...f, originPostalCode: e.target.value }))}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
        />
        <input
          placeholder="Dirección destino (opcional)"
          value={form.destinationAddress}
          onChange={(e) => setForm((f) => ({ ...f, destinationAddress: e.target.value }))}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
        />
        <input
          required
          placeholder="CP destino (España, obligatorio)"
          value={form.destinationPostalCode}
          onChange={(e) => setForm((f) => ({ ...f, destinationPostalCode: e.target.value }))}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
        />
        <input
          placeholder="Peso kg (opcional)"
          value={form.packageWeightKg}
          onChange={(e) => setForm((f) => ({ ...f, packageWeightKg: e.target.value }))}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
        />
        <input
          placeholder="Remitente (opcional)"
          value={form.senderName}
          onChange={(e) => setForm((f) => ({ ...f, senderName: e.target.value }))}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
        />
        <input
          placeholder="Tel remitente (opcional)"
          value={form.senderPhone}
          onChange={(e) => setForm((f) => ({ ...f, senderPhone: e.target.value }))}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
        />
        <input
          placeholder="Destinatario (opcional)"
          value={form.recipientName}
          onChange={(e) => setForm((f) => ({ ...f, recipientName: e.target.value }))}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
        />
        <input
          placeholder="Tel destinatario (opcional)"
          value={form.recipientPhone}
          onChange={(e) => setForm((f) => ({ ...f, recipientPhone: e.target.value }))}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
        />
        <input
          placeholder="Total céntimos (opcional, ej 1599 = 15,99 €)"
          value={form.totalAmountCents}
          onChange={(e) => setForm((f) => ({ ...f, totalAmountCents: e.target.value }))}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
        />
        <textarea
          placeholder="Notas (opcional)"
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
          rows={3}
        />
        <button type="submit" className="w-full rounded-md bg-ldh-orange py-2.5 text-sm font-semibold text-white">
          Crear envío
        </button>
      </form>
    </div>
  );
}
