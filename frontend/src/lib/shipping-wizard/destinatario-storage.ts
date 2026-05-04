import type { DestinatarioDraft } from './types';

export const DESTINATARIO_STORAGE_KEY = 'ldh_shipping_destinatario';

export function defaultDestinatarioDraft(): DestinatarioDraft {
  return {
    tipo: 'particular',
    nombre: '',
    primerApellido: '',
    segundoApellido: '',
    email: '',
    prefijo: '+34',
    telefono: '',
    busquedaCpOficina: '',
    oficinaSeleccionada: null,
    direccion: '',
    codigoPostal: '',
    pais: 'España',
    localidad: '',
    provincia: '',
  };
}

export function readDestinatarioDraft(): DestinatarioDraft {
  if (typeof window === 'undefined') return defaultDestinatarioDraft();
  try {
    const raw = sessionStorage.getItem(DESTINATARIO_STORAGE_KEY);
    if (!raw) return defaultDestinatarioDraft();
    const parsed = JSON.parse(raw) as Partial<DestinatarioDraft>;
    return { ...defaultDestinatarioDraft(), ...parsed };
  } catch {
    return defaultDestinatarioDraft();
  }
}

export function persistDestinatarioDraft(d: DestinatarioDraft): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(DESTINATARIO_STORAGE_KEY, JSON.stringify(d));
}
