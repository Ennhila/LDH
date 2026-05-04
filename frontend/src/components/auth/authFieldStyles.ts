/** Inputs compartidos (login / registro): borde inferior dorado LDH. */
export function authInputClass(hasError: boolean): string {
  return [
    'w-full rounded-sm border border-slate-800/20 bg-slate-100 px-4 py-3.5 text-sm text-slate-900',
    'border-b-2 border-b-ldh-gold placeholder:text-slate-500',
    'outline-none transition-colors',
    'focus:border-ldh-navy focus:border-b-ldh-gold',
    hasError ? '!border-red-400 !border-b-red-500' : '',
  ].join(' ');
}
