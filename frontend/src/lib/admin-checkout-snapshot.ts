import { apiFetch } from './api';
import type { ClientCheckoutSnapshotResponse } from '../types/api';

export async function fetchAdminCheckoutSnapshot(envioId: number): Promise<ClientCheckoutSnapshotResponse> {
  return apiFetch<ClientCheckoutSnapshotResponse>(`/api/admin/envios/${envioId}/checkout-snapshot`);
}
