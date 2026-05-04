import { useEffect, useState } from 'react';
import { getToken } from '../../lib/api';
import { fetchMe, logout } from '../../lib/auth-client';
import type { Role, UserMe } from '../../types/api';

function dashboardLabel(role: Role): string {
  switch (role) {
    case 'ADMIN':
      return 'Panel admin';
    case 'REPARTIDOR':
      return 'Panel repartidor';
    default:
      return 'Mi cuenta';
  }
}

function dashboardHref(role: Role): string {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'REPARTIDOR':
      return '/repartidor';
    default:
      return '/cuenta';
  }
}

export function HeaderNav() {
  const [user, setUser] = useState<UserMe | null | undefined>(undefined);

  useEffect(() => {
    const t = getToken();
    if (!t) {
      setUser(null);
      return;
    }
    let cancelled = false;
    fetchMe()
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (user === undefined) {
    return <div className="h-9 w-32 animate-pulse rounded bg-slate-100" aria-hidden />;
  }

  if (user) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-3">
        <span className="hidden max-w-[200px] truncate text-sm text-slate-600 sm:inline" title={user.email}>
          {user.fullName}
        </span>
        <a
          href={dashboardHref(user.role)}
          className="inline-flex items-center rounded-md bg-ldh-navy px-3 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-ldh-navy-dark sm:text-sm"
        >
          {dashboardLabel(user.role)}
        </a>
        <button
          type="button"
          onClick={() => {
            logout();
            window.location.href = '/';
          }}
          className="text-xs font-semibold text-slate-600 underline-offset-2 hover:text-ldh-orange hover:underline sm:text-sm"
        >
          Salir
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <a
        href="/login"
        className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ldh-navy transition-colors hover:text-ldh-orange"
      >
        <svg
          className="h-4 w-4 shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        Iniciar sesión
      </a>
    </div>
  );
}
