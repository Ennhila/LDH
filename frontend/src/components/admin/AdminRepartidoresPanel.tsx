import { useEffect, useMemo, useState } from 'react';
import { useRequireRole } from '../../hooks/use-require-role';
import { apiFetch } from '../../lib/api';
import {
  emailErrorMessage,
  isStrongPassword,
  isSpainPostalCode,
  strongPasswordHint,
} from '../../lib/validation/inputs';
import type { Repartidor } from '../../types/api';

const PAGE_SIZE = 10;

const emptyForm = {
  email: '',
  password: '',
  fullName: '',
  postalCode: '',
  phone: '',
};

export default function AdminRepartidoresPanel() {
  const { me, loading: authLoading } = useRequireRole('ADMIN');
  const [items, setItems] = useState<Repartidor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pwdReset, setPwdReset] = useState<{ id: number; password: string } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);

  async function refresh() {
    const list = await apiFetch<Repartidor[]>('/api/admin/repartidores');
    setItems(list);
  }

  useEffect(() => {
    if (!me) return;
    refresh().catch((e) => setError(e instanceof Error ? e.message : 'Error'));
  }, [me]);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));

  const pageItems = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, page, totalPages]);

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

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalOpen]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const em = emailErrorMessage(form.email);
    if (em) {
      setError(em);
      return;
    }
    if (!isSpainPostalCode(form.postalCode)) {
      setError(
        'Código postal español no válido (01–52 o Canarias 35/38; no valores ficticios como 22222).',
      );
      return;
    }
    if (editingId == null) {
      if (!isStrongPassword(form.password)) {
        setError(strongPasswordHint());
        return;
      }
    }
    try {
      if (editingId != null) {
        await apiFetch(`/api/admin/repartidores/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({
            email: form.email.trim(),
            fullName: form.fullName.trim(),
            postalCode: form.postalCode.trim().replace(/\D/g, '').slice(0, 5),
            phone: form.phone.trim() || null,
          }),
        });
      } else {
        await apiFetch('/api/admin/repartidores', {
          method: 'POST',
          body: JSON.stringify({
            email: form.email.trim(),
            password: form.password,
            fullName: form.fullName.trim(),
            postalCode: form.postalCode.trim().replace(/\D/g, '').slice(0, 5),
            phone: form.phone.trim() || null,
          }),
        });
      }
      setModalOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }

  function startEdit(r: Repartidor) {
    setError(null);
    setEditingId(r.id);
    setForm({
      email: r.email,
      password: '',
      fullName: r.fullName,
      postalCode: r.postalCode ?? '',
      phone: r.phone ?? '',
    });
    setModalOpen(true);
  }

  async function disable(id: number) {
    if (!confirm('¿Desactivar repartidor?')) return;
    setError(null);
    try {
      await apiFetch(`/api/admin/repartidores/${id}`, { method: 'DELETE' });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }

  async function submitPasswordReset() {
    if (!pwdReset) return;
    setError(null);
    if (!isStrongPassword(pwdReset.password)) {
      setError(strongPasswordHint());
      return;
    }
    try {
      await apiFetch(`/api/admin/repartidores/${pwdReset.id}/password`, {
        method: 'POST',
        body: JSON.stringify({ password: pwdReset.password }),
      });
      setPwdReset(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }

  if (authLoading || !me) return <p className="text-slate-600">Cargando…</p>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ldh-navy">Repartidores</h1>
          <p className="mt-1 text-slate-600">Crear cuentas y gestionar datos (solo administración).</p>
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

      {pwdReset ? (
        <div className="max-w-xl rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
          <p className="font-medium text-amber-900">Nueva contraseña para repartidor #{pwdReset.id}</p>
          <input
            type="password"
            minLength={8}
            className="mt-2 w-full rounded-md border border-amber-200 px-3 py-2"
            value={pwdReset.password}
            onChange={(e) => setPwdReset({ ...pwdReset, password: e.target.value })}
          />
          <div className="mt-2 flex gap-2">
            <button type="button" className="rounded-md bg-ldh-navy px-3 py-1.5 text-white" onClick={submitPasswordReset}>
              Actualizar
            </button>
            <button type="button" className="rounded-md border border-slate-200 px-3 py-1.5" onClick={() => setPwdReset(null)}>
              Cerrar
            </button>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Activo</th>
              <th className="px-4 py-3">Turno</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {pageItems.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{r.email}</td>
                <td className="px-4 py-3">{r.fullName}</td>
                <td className="px-4 py-3">{r.enabled ? 'Sí' : 'No'}</td>
                <td className="px-4 py-3">{r.shiftActive ? 'Sí' : 'No'}</td>
                <td className="px-4 py-3 text-right">
                  <button type="button" className="text-ldh-navy hover:underline" onClick={() => startEdit(r)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className="ml-3 text-ldh-navy hover:underline"
                    onClick={() => setPwdReset({ id: r.id, password: '' })}
                  >
                    Contraseña
                  </button>
                  <button type="button" className="ml-3 text-red-600 hover:underline" onClick={() => disable(r.id)}>
                    Desactivar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pageItems.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">No hay repartidores.</p>
        ) : null}
      </div>

      {items.length > PAGE_SIZE ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <p className="text-sm text-slate-600">
            Página <span className="font-semibold text-ldh-navy">{page}</span> de{' '}
            <span className="font-semibold text-ldh-navy">{totalPages}</span>
            <span className="text-slate-500"> · {items.length} repartidor(es)</span>
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
          aria-labelledby="repartidor-modal-title"
        >
          <button type="button" className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]" aria-label="Cerrar" onClick={closeModal} />
          <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 id="repartidor-modal-title" className="text-lg font-semibold text-ldh-navy">
                {editingId ? 'Editar repartidor' : 'Nuevo repartidor'}
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
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
              {editingId == null ? (
                <input
                  required
                  type="password"
                  minLength={8}
                  placeholder="Contraseña inicial"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                />
              ) : null}
              <input
                required
                placeholder="Nombre completo"
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                required
                placeholder="Código postal (ES)"
                value={form.postalCode}
                onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                placeholder="Teléfono"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
              <div className="flex flex-wrap gap-2 pt-2">
                <button type="submit" className="rounded-md bg-ldh-orange px-4 py-2 text-sm font-semibold text-white">
                  {editingId ? 'Guardar' : 'Crear cuenta'}
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
