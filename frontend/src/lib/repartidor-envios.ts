import type { Envio } from '../types/api';

export function isActiveRepartidorEnvio(e: Envio): boolean {
  return e.status !== 'DELIVERED' && e.status !== 'EXCEPTION';
}

export function isHistorialRepartidorEnvio(e: Envio): boolean {
  return e.status === 'DELIVERED' || e.status === 'EXCEPTION';
}

/** Más recientes primero (última actualización). */
export function sortHistorialEnvios(list: Envio[]): Envio[] {
  return [...list].sort((a, b) => {
    const tb = new Date(b.updatedAt).getTime();
    const ta = new Date(a.updatedAt).getTime();
    return tb - ta;
  });
}
