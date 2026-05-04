import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { getPackageSummaryLines } from '../shipping-wizard/draft';
import { formatOficinaDireccion, formatOficinaLabel } from '../shipping-wizard/mock-oficinas';
import { fetchUrlToDataUrl } from './image-data-url';
import type { OrderSnapshot } from './order-snapshot';

export async function downloadEtiquetaPdf(snapshot: OrderSnapshot): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a6', orientation: 'portrait' });
  const W = doc.internal.pageSize.getWidth();
  let y = 8;

  try {
    const logo = await fetchUrlToDataUrl('/images/logo.png');
    doc.addImage(logo, 'PNG', 8, y, 28, 10);
  } catch {
    doc.setFontSize(12).setTextColor(45, 62, 139).setFont('helvetica', 'bold');
    doc.text('LDH', 8, y + 6);
  }

  doc.setFontSize(8).setFont('helvetica', 'bold').setTextColor(0);
  doc.text('ETIQUETA DE ENVÍO', W - 8, y + 4, { align: 'right' });
  y += 14;

  doc.setDrawColor(200);
  doc.line(8, y, W - 8, y);
  y += 5;

  doc.setFontSize(9).setFont('helvetica', 'bold');
  doc.text('Tracking', 8, y);
  y += 4;
  doc.setFont('courier', 'bold').setFontSize(11);
  doc.text(snapshot.trackingNumber, 8, y);
  y += 8;

  const canvas = document.createElement('canvas');
  JsBarcode(canvas, snapshot.trackingNumber.replace(/\s/g, ''), {
    format: 'CODE128',
    width: 1.8,
    height: 50,
    displayValue: true,
    fontSize: 12,
    margin: 0,
  });
  const barcodeData = canvas.toDataURL('image/png');
  doc.addImage(barcodeData, 'PNG', 8, y, W - 16, 18);
  y += 22;

  const qrUrl = `http://localhost:4321/track?t=${encodeURIComponent(snapshot.trackingNumber)}`;
  const qrData = await QRCode.toDataURL(qrUrl, { margin: 1, width: 180 });
  doc.addImage(qrData, 'PNG', W - 38, y - 6, 30, 30);

  doc.setFont('helvetica', 'normal').setFontSize(7);
  doc.text('Escanee para seguimiento', W - 38, y + 28);

  y += 8;
  doc.setFont('helvetica', 'bold').setFontSize(8);
  doc.text('REMITENTE', 8, y);
  y += 4;
  doc.setFont('helvetica', 'normal').setFontSize(7);
  const r = snapshot.remitente;
  doc.text(`${r.nombre} ${r.primerApellido}`.trim(), 8, y);
  y += 3.5;
  doc.text(`${r.direccion}, ${r.codigoPostal} ${r.localidad}`, 8, y);
  y += 6;

  doc.setFont('helvetica', 'bold').setFontSize(8);
  doc.text('DESTINATARIO', 8, y);
  y += 4;
  doc.setFont('helvetica', 'normal').setFontSize(7);
  const d = snapshot.destinatario;
  doc.text(`${d.nombre} ${d.primerApellido}`.trim(), 8, y);
  y += 3.5;
  if (snapshot.delivery === 'Oficina' && d.oficinaSeleccionada) {
    doc.text(formatOficinaLabel(d.oficinaSeleccionada), 8, y);
    y += 3.5;
    doc.text(formatOficinaDireccion(d.oficinaSeleccionada), 8, y);
  } else {
    doc.text(`${d.direccion}, ${d.codigoPostal} ${d.localidad}`, 8, y);
  }
  y += 6;

  const { weight, size } = getPackageSummaryLines(snapshot.draft.packageTier);
  doc.setFont('helvetica', 'bold').setFontSize(8);
  doc.text('PAQUETE', 8, y);
  y += 4;
  doc.setFont('helvetica', 'normal').setFontSize(7);
  doc.text(`${snapshot.productTitle}`, 8, y);
  y += 3.5;
  doc.text(`${weight} · ${size}`, 8, y);

  doc.setFontSize(6).setTextColor(120);
  doc.text('LDH — Etiqueta generada en cliente (demo)', 8, 142);

  doc.save(`LDH-etiqueta-${snapshot.trackingNumber}.pdf`);
}
