import { useEffect, useState } from 'react';
import { fetchMe, homeForRole, logout } from '../lib/auth-client';
import type { Role, UserMe } from '../types/api';

export function useRequireRole(role: Role): { me: UserMe | null; loading: boolean } {
  const [me, setMe] = useState<UserMe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const u = await fetchMe();
        if (cancelled) return;
        if (u.role !== role) {
          window.location.href = homeForRole(u.role);
          return;
        }
        setMe(u);
      } catch {
        logout();
        window.location.href = '/login';
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [role]);

  return { me, loading };
}
