import { ProgressTracker } from './ProgressTracker';

type Props = {
  currentStep: number;
  subtitle?: string | null;
};

export function WizardPageHeader({ currentStep, subtitle }: Props) {
  return (
    <div className="border-b border-slate-200 bg-white py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-center text-2xl font-extrabold text-slate-800 sm:text-3xl">
          Servicio especial de paquetería
        </h1>
        {subtitle ? (
          <p className="mx-auto mt-2 max-w-3xl text-center text-base text-slate-600">{subtitle}</p>
        ) : null}
        <div className="mt-6">
          <ProgressTracker currentStep={currentStep} />
        </div>
      </div>
    </div>
  );
}
