import { HeaderNav } from './HeaderNav';

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-100/80 bg-white/90 backdrop-blur-md">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-center px-4 sm:h-17 sm:px-6 lg:px-8">
        <a
          href="/"
          className="z-10 flex items-center gap-2 transition-opacity hover:opacity-90"
          aria-label="LDH — Inicio"
        >
          <img
            src="/images/logo.png"
            alt=""
            className="h-8 w-auto sm:h-10"
            width="140"
            height="40"
          />
        </a>
        <nav
          className="absolute top-1/2 right-4 z-10 flex max-w-[min(50vw,14rem)] -translate-y-1/2 items-center justify-end sm:right-6 sm:max-w-none lg:right-8"
          aria-label="Principal"
        >
          <HeaderNav />
        </nav>
      </div>
    </header>
  );
}
