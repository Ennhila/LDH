import { ChevronDown, Pencil } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export type EditMenuItem = { label: string; href: string };

type Props = {
  items: EditMenuItem[];
};

export function SectionEditDropdown({ items }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-xs font-bold tracking-wide text-ldh-navy uppercase transition-colors hover:text-ldh-orange"
        aria-expanded={open}
        aria-haspopup="true"
      >
        Editar
        <Pencil className="h-3.5 w-3.5" aria-hidden />
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? (
        <div
          className="absolute top-full right-0 z-30 mt-1 min-w-[13rem] rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          role="menu"
        >
          {items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              role="menuitem"
              className="block px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}
