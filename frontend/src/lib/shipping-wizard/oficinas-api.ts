import { apiFetch } from '../api';
import type { Oficina as ApiOficina } from '../../types/api';
import type { Oficina } from './types';

/**
 * Oficinas públicas del backend → modelo del wizard (paso 3).
 */
export function mapApiOficinaToWizard(o: ApiOficina): Oficina {
  return {
    id: String(o.id),
    codigoPublico: `LDH-${o.id}`,
    calle: o.addressLine,
    codigoPostal: o.postalCode.replace(/\D/g, '').slice(0, 5) || o.postalCode,
    ciudad: o.city,
    provincia: o.city,
  };
}

export async function fetchPublicOficinasForWizard(): Promise<Oficina[]> {
  const list = await apiFetch<ApiOficina[]>('/api/public/oficinas', { skipAuth: true });
  return list.map(mapApiOficinaToWizard);
}
