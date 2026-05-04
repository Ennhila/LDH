import { API_BASE } from './api-base';
import { getToken } from './api';

/** Descarga CSV de matriz (requiere auth). */
export async function downloadPriceMatrixCsv(deliveryType: string): Promise<void> {
  const t = getToken();
  const res = await fetch(
    `${API_BASE}/api/admin/prices/matrix/export.csv?deliveryType=${encodeURIComponent(deliveryType)}`,
    { headers: t ? { Authorization: `Bearer ${t}` } : {} },
  );
  if (!res.ok) throw new Error('No se pudo exportar CSV');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ldh-price-matrix.csv';
  a.click();
  URL.revokeObjectURL(url);
}
