import { Check } from 'lucide-react';
import { WIZARD_STEPS } from '../../lib/shipping-wizard/constants';

type Props = {
  currentStep: number;
};

export function ProgressTracker({ currentStep }: Props) {
  const allComplete = currentStep >= 4;

  return (
    <nav aria-label="Progreso del envío" className="w-full overflow-x-auto pb-1">
      <ol className="flex min-w-max items-center justify-center px-1 sm:min-w-0">
        {WIZARD_STEPS.map((step, index) => {
          const done = allComplete || step.id < currentStep;
          const active = !allComplete && step.id === currentStep;
          const last = index === WIZARD_STEPS.length - 1;
          return (
            <li key={step.id} className="flex items-center">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold sm:h-9 sm:w-9 sm:text-sm ${
                    active
                      ? 'bg-ldh-orange text-white'
                      : done
                        ? 'bg-emerald-600 text-white'
                        : 'border border-slate-300 bg-white text-slate-500'
                  }`}
                >
                  {done ? <Check className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={3} aria-hidden /> : step.id}
                </span>
                <span
                  className={`max-w-[5.5rem] text-[10px] font-semibold leading-tight sm:max-w-none sm:text-xs md:text-sm ${
                    allComplete
                      ? 'text-emerald-700'
                      : active
                        ? 'text-ldh-orange'
                        : done
                          ? 'text-slate-700'
                          : 'text-slate-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {!last && (
                <span
                  className="mx-1.5 h-px w-4 shrink-0 bg-slate-300 sm:mx-2 md:mx-3 md:w-8"
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
