import type { Oficina } from './types';

/**
 * Catálogo mock de oficinas (sustituir por API desde dashboard admin / Spring Boot).
 * Ejemplo de integración futura:
 * `export async function fetchOficinasPorCp(cp: string): Promise<Oficina[]> { ... }`
 */
export const MOCK_OFICINAS: Oficina[] = [
  {
    id: 'of-001',
    codigoPublico: '2828194',
    calle: 'VILLANUEVA 30',
    codigoPostal: '28001',
    ciudad: 'MADRID',
    provincia: 'MADRID',
  },
  {
    id: 'of-002',
    codigoPublico: '2842101',
    calle: 'GRAN VÍA 45',
    codigoPostal: '28013',
    ciudad: 'MADRID',
    provincia: 'MADRID',
  },
  {
    id: 'of-003',
    codigoPublico: '4918801',
    calle: 'SANTA CLARA 12',
    codigoPostal: '49021',
    ciudad: 'ZAMORA',
    provincia: 'ZAMORA',
  },
  {
    id: 'of-004',
    codigoPublico: '0801122',
    calle: 'PASSEIG DE GRÀCIA 21',
    codigoPostal: '08001',
    ciudad: 'BARCELONA',
    provincia: 'BARCELONA',
  },
  {
    id: 'of-005',
    codigoPublico: '4109199',
    calle: 'REYES CATÓLICOS 8',
    codigoPostal: '41001',
    ciudad: 'SEVILLA',
    provincia: 'SEVILLA',
  },
];

export function formatOficinaLabel(o: Oficina): string {
  return `Oficina ${o.codigoPublico}`;
}

export function formatOficinaDireccion(o: Oficina): string {
  const parts = [o.calle, o.codigoPostal, o.ciudad];
  if (o.provincia?.trim()) parts.push(o.provincia);
  return parts.join(', ').toUpperCase();
}

/** Filtra por CP (5 dígitos = coincidencia exacta; menos = prefijo). */
export function filtrarOficinasPorCp(catalog: Oficina[], cp: string): Oficina[] {
  const n = cp.replace(/\D/g, '');
  if (!n) return [];
  if (n.length >= 5) return catalog.filter((o) => o.codigoPostal === n);
  return catalog.filter((o) => o.codigoPostal.startsWith(n));
}

/** @deprecated Prefer cargar oficinas desde API y usar {@link filtrarOficinasPorCp}. */
export function buscarOficinasPorCp(cp: string): Oficina[] {
  return filtrarOficinasPorCp(MOCK_OFICINAS, cp);
}
