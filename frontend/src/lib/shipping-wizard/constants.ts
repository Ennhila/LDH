import type { FilterId } from './types';

/** Pasos mostrados en la barra de progreso (la pantalla final puede ser aparte). */
export const WIZARD_STEPS = [
  { id: 1, label: 'Producto' },
  { id: 2, label: 'Remitente' },
  { id: 3, label: 'Destinatario' },
  { id: 4, label: 'Resumen y pago' },
] as const;

export const FILTER_BUTTONS: { id: FilterId; label: string }[] = [
  { id: 'urgent', label: 'Entrega urgente' },
  { id: 'office_admission', label: 'Admisión en oficina' },
  { id: 'pickup_home', label: 'Recogida a domicilio' },
  { id: 'delivery_office', label: 'Entrega en oficina' },
  { id: 'more', label: 'Más filtros' },
];
