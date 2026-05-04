type Props = {
  label: string;
  active: boolean;
  onClick: () => void;
};

export function FilterButton({ label, active, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-lg border px-4 py-2.5 text-xs font-bold tracking-wide uppercase transition-colors sm:text-sm ${
        active
          ? 'border-ldh-orange bg-orange-50 text-ldh-orange shadow-sm'
          : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
      }`}
    >
      {label}
    </button>
  );
}
