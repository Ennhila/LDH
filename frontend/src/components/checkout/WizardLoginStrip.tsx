import { useEffect, useState } from 'react';
import { getToken } from '../../lib/api';
import { fetchMe } from '../../lib/auth-client';
import type { UserMe } from '../../types/api';

export function WizardLoginStrip() {
  const [me, setMe] = useState<UserMe | null | undefined>(undefined);

  useEffect(() => {
    if (!getToken()) {
      setMe(null);
      return;
    }
    let cancelled = false;
    fetchMe()
      .then((u) => {
        if (!cancelled) setMe(u);
      })
      .catch(() => {
        if (!cancelled) setMe(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (me === undefined) {
    return <div className="mt-10 h-16 animate-pulse rounded-lg bg-slate-100" aria-hidden />;
  }

  if (me && me.role === 'CLIENTE') {
    return (
      <div className="mt-10 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-6 shadow-sm sm:px-8">
        <p className="text-center text-sm font-medium text-emerald-950 sm:text-left">
          Sesión iniciada como <strong>{me.fullName}</strong>. Al confirmar el envío se guardará en tu cuenta con el
          número de seguimiento del servidor.
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-3 sm:justify-start">
          <a
            href="/cuenta/mis-envios"
            className="text-sm font-bold text-emerald-900 underline decoration-2 underline-offset-2 hover:text-ldh-orange"
          >
            Ver mis envíos
          </a>
        </div>
      </div>
    );
  }

  if (me) {
    return (
      <div className="mt-10 rounded-lg border border-slate-200 bg-white px-4 py-6 shadow-sm sm:px-8">
        <p className="text-center text-sm text-slate-700 sm:text-left">
          Has iniciado sesión como <strong>{me.fullName}</strong> ({me.role}). Este asistente registra envíos en la
          cuenta <strong>cliente</strong>. Si necesitas cotizar para un cliente, usa una cuenta cliente o cierra sesión.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10 rounded-lg border border-slate-200 bg-white px-4 py-6 shadow-sm sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-center text-sm font-medium text-slate-700 sm:text-left">
          ¿Tienes cuenta cliente? <span className="text-slate-600">Inicia sesión para guardar el envío en LDH.</span>
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <a
            href="/registro"
            className="rounded-lg px-4 py-2.5 text-center text-xs font-bold text-ldh-navy uppercase underline decoration-2 underline-offset-2 hover:text-ldh-orange sm:text-sm"
          >
            Regístrate aquí
          </a>
          <a
            href="/login"
            className="rounded-lg border-2 border-ldh-orange bg-white px-4 py-2.5 text-center text-xs font-bold text-ldh-orange uppercase transition-colors hover:bg-orange-50 sm:text-sm"
          >
            Ya tengo cuenta
          </a>
        </div>
      </div>
    </div>
  );
}
