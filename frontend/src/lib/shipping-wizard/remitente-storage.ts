import type { RemitenteDraft } from './types';

export const REMITENTE_STORAGE_KEY = 'ldh_shipping_remitente';

export const defaultRemitenteDraft = (): RemitenteDraft => ({
  tipo: 'particular',
  nombre: '',
  primerApellido: '',
  segundoApellido: '',
  direccion: '',
  codigoPostal: '',
  pais: 'España',
  localidad: '',
  provincia: '',
  email: '',
  prefijo: '+34',
  telefono: '',
});

export function readRemitenteDraft(): RemitenteDraft {
  if (typeof window === 'undefined') return defaultRemitenteDraft();
  try {
    const raw = sessionStorage.getItem(REMITENTE_STORAGE_KEY);
    if (!raw) return defaultRemitenteDraft();
    return { ...defaultRemitenteDraft(), ...JSON.parse(raw) } as RemitenteDraft;
  } catch {
    return defaultRemitenteDraft();
  }
}

export function persistRemitenteDraft(draft: RemitenteDraft): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(REMITENTE_STORAGE_KEY, JSON.stringify(draft));
}
