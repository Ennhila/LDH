import type { Envio, EnvioStatus } from '../types/api';

export const STATUS_LABEL_ES: Record<EnvioStatus, string> = {
  PENDING: 'Pendiente',
  PICKED_UP: 'Recogida realizada',
  IN_TRANSIT: 'En tránsito',
  OUT_FOR_DELIVERY: 'En reparto',
  DELIVERED: 'Entregado',
  EXCEPTION: 'Incidencia',
};

const FLOW: EnvioStatus[] = [
  'PENDING',
  'PICKED_UP',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

export type TimelineEntry = {
  status: EnvioStatus;
  label: string;
  at: Date;
  /** Pasos intermedios: hora repartida entre alta y última actualización */
  estimated: boolean;
};

export function buildShipmentTimeline(envio: Envio): TimelineEntry[] {
  const created = new Date(envio.createdAt).getTime();
  const updated = new Date(envio.updatedAt).getTime();
  const safeUpdated = Number.isFinite(updated) && updated >= created ? updated : created;

  if (envio.status === 'EXCEPTION') {
    return [
      {
        status: 'EXCEPTION',
        label: STATUS_LABEL_ES.EXCEPTION,
        at: new Date(safeUpdated),
        estimated: false,
      },
      {
        status: 'PENDING',
        label: STATUS_LABEL_ES.PENDING,
        at: new Date(created),
        estimated: false,
      },
    ];
  }

  const idx = FLOW.indexOf(envio.status);
  if (idx === -1) {
    return [
      {
        status: envio.status,
        label: STATUS_LABEL_ES[envio.status] ?? envio.status,
        at: new Date(safeUpdated),
        estimated: false,
      },
    ];
  }

  const entries: TimelineEntry[] = [];
  for (let i = 0; i <= idx; i++) {
    const status = FLOW[i]!;
    let at: Date;
    let estimated = false;
    if (idx === 0) {
      at = new Date(created);
    } else if (i === 0) {
      at = new Date(created);
    } else if (i === idx) {
      at = new Date(safeUpdated);
    } else {
      at = new Date(created + ((safeUpdated - created) * i) / idx);
      estimated = true;
    }
    entries.push({
      status,
      label: STATUS_LABEL_ES[status],
      at,
      estimated,
    });
  }

  return entries.sort((a, b) => b.at.getTime() - a.at.getTime());
}

export function formatTrackingDateTime(d: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}
