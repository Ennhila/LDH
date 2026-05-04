import { HeaderNav } from '../layout/HeaderNav';

export function WizardHeader() {
  return (
    <header className="border-t-4 border-ldh-orange bg-white shadow-sm">
      <div className="relative mx-auto flex max-w-7xl items-center justify-center px-4 py-4 sm:px-6 lg:px-8">
        <div className="absolute left-4 top-1/2 z-10 -translate-y-1/2 sm:left-6">
          <HeaderNav />
        </div>
        <a href="/" className="inline-flex transition-opacity hover:opacity-90" aria-label="Ir al inicio LDH">
          <img src="/images/logo.png" alt="LDH" className="h-9 w-auto sm:h-10" width="140" height="40" />
        </a>
        <a
          href="/"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-ldh-navy underline-offset-2 hover:underline sm:right-6"
        >
          Ir al inicio
        </a>
      </div>
    </header>
  );
}
