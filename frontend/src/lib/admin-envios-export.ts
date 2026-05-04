import type { Envio } from '../types/api';

function csvEscape(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** CSV con BOM para Excel (UTF-8). */
export function enviosToCsv(rows: Envio[]): string {
  const headers = [
    'id',
    'trackingNumber',
    'status',
    'clientEmail',
    'originAddress',
    'originPostalCode',
    'destinationAddress',
    'destinationPostalCode',
    'packageWeightKg',
    'senderName',
    'recipientName',
    'totalAmountCents',
    'currency',
    'exceptionReason',
    'exceptionNotes',
    'createdAt',
    'updatedAt',
  ];
  const lines = [headers.join(',')];
  for (const e of rows) {
    const vals = [
      String(e.id),
      e.trackingNumber,
      e.status,
      e.clientEmail ?? '',
      e.originAddress ?? '',
      e.originPostalCode ?? '',
      e.destinationAddress ?? '',
      e.destinationPostalCode ?? '',
      e.packageWeightKg != null ? String(e.packageWeightKg) : '',
      e.senderName ?? '',
      e.recipientName ?? '',
      e.totalAmountCents != null ? String(e.totalAmountCents) : '',
      e.currency ?? '',
      e.exceptionReason ?? '',
      e.exceptionNotes ?? '',
      e.createdAt,
      e.updatedAt,
    ];
    lines.push(vals.map((v) => csvEscape(v)).join(','));
  }
  return '\uFEFF' + lines.join('\r\n');
}

export function downloadEnviosCsv(filename: string, rows: Envio[]): void {
  const blob = new Blob([enviosToCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
