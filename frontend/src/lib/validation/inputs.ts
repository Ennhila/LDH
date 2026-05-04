/** Alineado con validadores del backend (RealisticEmail, StrongPassword, SpanishPostalCode). */

const SPAIN_CP =
  /^(?:(?:0[1-9]|[1-4][0-9]|5[0-2])\d{3}|(?:35|38)\d{3})$/;

const REALISTIC_EMAIL =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

/** Unicode: mayúscula, minúscula, dígito y símbolo (no espacio). */
const STRONG_PASSWORD =
  /^(?=.*\p{Lu})(?=.*\p{Ll})(?=.*\p{N})(?=.*[^\p{L}\p{N}\s]).{8,128}$/u;

export const WIZARD_PAISES = [
  'España',
  'Portugal',
  'Francia',
  'Italia',
  'Alemania',
  'Otro (UE)',
] as const;

export type WizardPais = (typeof WIZARD_PAISES)[number];

export const PAIS_TO_PREFIX: Record<string, string> = {
  España: '+34',
  Portugal: '+351',
  Francia: '+33',
  Italia: '+39',
  Alemania: '+49',
  'Otro (UE)': '+34',
};

function isAllSameDigit(s: string): boolean {
  const c = s[0];
  return s.split('').every((ch) => ch === c);
}

function isSequential(s: string): boolean {
  let asc = true;
  let desc = true;
  for (let i = 1; i < s.length; i++) {
    const d = s.charCodeAt(i) - s.charCodeAt(i - 1);
    if (d !== 1) asc = false;
    if (d !== -1) desc = false;
  }
  return asc || desc;
}

export function isSpainPostalCode(value: string | null | undefined): boolean {
  if (value == null || !value.trim()) return false;
  const n = value.trim().replace(/\D/g, '');
  if (n.length !== 5) return false;
  if (isAllSameDigit(n)) return false;
  if (isSequential(n)) return false;
  return SPAIN_CP.test(n);
}

export function isRealisticEmail(value: string | null | undefined): boolean {
  if (value == null || !value.trim()) return false;
  const t = value.trim();
  return REALISTIC_EMAIL.test(t) && !t.includes('..');
}

export function isStrongPassword(value: string | null | undefined): boolean {
  if (value == null || value.length === 0) return false;
  return STRONG_PASSWORD.test(value);
}

export function strongPasswordHint(): string {
  return 'Mínimo 8 caracteres, con mayúscula, minúscula, número y un símbolo (ej. ! o #).';
}

export function validateWizardPostal(
  pais: string,
  raw: string,
): { ok: true } | { ok: false; message: string } {
  const t = raw.trim();
  if (!t) return { ok: false, message: 'Indica el código postal.' };
  if (pais === 'España') {
    if (!isSpainPostalCode(t)) {
      return {
        ok: false,
        message:
          'CP español no válido (provincias 01–52 o Canarias 35/38; no uses valores de prueba como 22222).',
      };
    }
    return { ok: true };
  }
  if (pais === 'Portugal') {
    const n = t.replace(/\D/g, '');
    if (!/^\d{7}$/.test(n)) {
      return { ok: false, message: 'CP portugués: 7 dígitos (ej. 1000-001).' };
    }
    return { ok: true };
  }
  if (pais === 'Francia' || pais === 'Italia' || pais === 'Alemania') {
    const n = t.replace(/\s/g, '');
    if (!/^\d{5}$/.test(n)) {
      return { ok: false, message: 'Indica 5 dígitos numéricos.' };
    }
    return { ok: true };
  }
  const compact = t.replace(/\s+/g, ' ').trim();
  if (compact.length < 3 || compact.length > 16) {
    return { ok: false, message: 'Entre 3 y 16 caracteres (formato CP de tu país).' };
  }
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9\- ]*[A-Za-z0-9])?$/.test(compact)) {
    return { ok: false, message: 'Usa letras, números, espacios o guiones.' };
  }
  return { ok: true };
}

export function wizardPhoneError(prefijo: string, telefono: string): string | null {
  const d = telefono.replace(/\D/g, '');
  if (!d) return 'Indica el teléfono.';
  if (prefijo === '+34') {
    if (!/^\d{9}$/.test(d)) return 'En España, 9 dígitos (sin el prefijo +34).';
    return null;
  }
  if (prefijo === '+351' || prefijo === '+33' || prefijo === '+39' || prefijo === '+49') {
    if (d.length < 8 || d.length > 11) return 'Revisa el número (8–11 dígitos).';
    return null;
  }
  if (d.length < 8 || d.length > 12) return 'Revisa el número de teléfono.';
  return null;
}

export function emailErrorMessage(value: string): string | null {
  if (!value.trim()) return 'Indica un email.';
  if (!isRealisticEmail(value)) return 'Email no válido (usa un dominio real, ej. correo@gmail.com).';
  return null;
}
