import { publicApiFetch } from './api';
import type { Envio } from '../types/api';

export async function fetchPublicShipment(trackingNumber: string): Promise<Envio> {
  const tn = trackingNumber.trim();
  if (!tn) throw new Error('Introduce un número de seguimiento');
  return publicApiFetch<Envio>(`/api/public/envios/track/${encodeURIComponent(tn)}`);
}
