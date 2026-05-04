import { jsPDF } from 'jspdf';
import type { Envio } from '../../types/api';

function moneyFromCents(cents: number | null | undefined, currency: string | null | undefined) {
  if (cents == null) return '—';
  const eur = cents / 100;
  const cur = currency ?? 'EUR';
  return `${eur.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur}`;
}

/** Factura mínima a partir de datos del API (sin el modelo completo del wizard). */
export function downloadEnvioFacturaPdf(envio: Envio) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 14;
  doc.setFontSize(16).setFont('helvetica', 'bold');
  doc.setTextColor(45, 62, 139);
  doc.text('LDH — Factura / resumen', 14, y);
  y += 10;
  doc.setFontSize(10).setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);
  doc.text(`Seguimiento: ${envio.trackingNumber}`, 14, y);
  y += 6;
  doc.text(`Estado: ${envio.status}`, 14, y);
  y += 6;
  doc.text(`Fecha: ${new Date(envio.createdAt).toLocaleString('es-ES')}`, 14, y);
  y += 6;
  doc.text(`Total: ${moneyFromCents(envio.totalAmountCents, envio.currency)}`, 14, y);
  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Origen / destino', 14, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Origen: ${envio.originAddress ?? '—'} (${envio.originPostalCode ?? '—'})`, 14, y);
  y += 6;
  doc.text(`Destino: ${envio.destinationAddress ?? '—'} (${envio.destinationPostalCode ?? '—'})`, 14, y);
  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Remitente / destinatario', 14, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Remitente: ${envio.senderName ?? '—'} · ${envio.senderPhone ?? ''}`, 14, y);
  y += 6;
  doc.text(`Destinatario: ${envio.recipientName ?? '—'} · ${envio.recipientPhone ?? ''}`, 14, y);
  y += 10;
  doc.text(
    `Paquete: ${envio.packageWeightKg ?? '—'} kg · ${envio.packageLengthCm ?? '—'}×${envio.packageWidthCm ?? '—'}×${envio.packageHeightCm ?? '—'} cm`,
    14,
    y,
  );
  const h = doc.internal.pageSize.getHeight();
  doc.setFontSize(8).setTextColor(120);
  doc.text('Documento generado desde tu área de cliente LDH.', 14, h - 10);
  doc.save(`factura-${envio.trackingNumber}.pdf`);
}
