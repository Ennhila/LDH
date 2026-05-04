import type { PackageTier } from './types';

/** Peso representativo por tramo (misma lógica que la cotización pública). */
export const PACKAGE_WEIGHT_KG: Record<PackageTier, number> = {
  '2kg': 2,
  '5kg': 5,
  '10kg': 10,
  '20kg': 20,
};

export const PACKAGE_SPECS: Record<
  PackageTier,
  { weightLabel: string; sizeLabel: string }
> = {
  '2kg': { weightLabel: 'Hasta 2kg', sizeLabel: '30×20×20' },
  '5kg': { weightLabel: 'Hasta 5kg', sizeLabel: '35×35×24' },
  '10kg': { weightLabel: 'Hasta 10kg', sizeLabel: '40×40×37' },
  '20kg': { weightLabel: 'Hasta 20kg', sizeLabel: '55×55×39' },
};
