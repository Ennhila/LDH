import type { LucideIcon } from 'lucide-react';

export type PackageSizeCardProps = {
  selected: boolean;
  title: string;
  dimensionLabel: string;
  icon: LucideIcon;
  onSelect: () => void;
};

export function PackageSizeCard({
  selected,
  title,
  dimensionLabel,
  icon: Icon,
  onSelect,
}: PackageSizeCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full flex-col items-center gap-2 rounded-xl border px-2 py-4 text-center transition-colors sm:px-3 ${
        selected
          ? 'border-ldh-orange bg-orange-50/80 shadow-sm'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <Icon
        className={`h-8 w-8 shrink-0 ${selected ? 'text-ldh-orange' : 'text-ldh-navy'}`}
        strokeWidth={1.75}
        aria-hidden
      />
      <span
        className={`text-xs font-bold leading-tight sm:text-sm ${selected ? 'text-ldh-navy' : 'text-slate-700'}`}
      >
        {title}
      </span>
      <span className="text-[10px] leading-snug text-slate-500 sm:text-xs">
        Dimensión: {dimensionLabel}
      </span>
    </button>
  );
}
