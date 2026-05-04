import { apiFetch } from './api';
import type { ClientCheckoutSnapshotResponse } from '../types/api';

export async function fetchClientCheckoutSnapshot(
  trackingNumber: string,
): Promise<ClientCheckoutSnapshotResponse> {
  return apiFetch<ClientCheckoutSnapshotResponse>(
    `/api/client/envios/by-tracking/${encodeURIComponent(trackingNumber)}/checkout-snapshot`,
  );
}
