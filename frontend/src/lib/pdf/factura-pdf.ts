import { jsPDF } from 'jspdf';
import { getPackageSummaryLines } from '../shipping-wizard/draft';
import { formatOficinaDireccion, formatOficinaLabel } from '../shipping-wizard/mock-oficinas';
import { fetchUrlToDataUrl } from './image-data-url';
import type { OrderSnapshot } from './order-snapshot';

function money(n: number) {
  return `${n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

export async function downloadFacturaPdf(snapshot: OrderSnapshot): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 12;

  try {
    const logo = await fetchUrlToDataUrl('/images/logo.png');
    doc.addImage(logo, 'PNG', pageW - 52, y, 40, 14);
  } catch {
    doc.setFontSize(14).setTextColor(45, 62, 139);
    doc.text('LDH', pageW - 30, y + 6);
  }

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(16).setFont('helvetica', 'bold');
  doc.text('Factura simplificada / resumen de pedido', 14, y + 6);
  y += 18;

  doc.setFontSize(9).setFont('helvetica', 'normal');
  doc.text(`Fecha: ${new Date(snapshot.createdAtIso).toLocaleString('es-ES')}`, 14, y);
  doc.text(`Nº seguimiento: ${snapshot.trackingNumber}`, 14, y + 5);
  doc.text(`Pago: ${labelPago(snapshot.paymentMethod)}`, 14, y + 10);
  y += 22;

  doc.setDrawColor(220);
  doc.line(14, y, pageW - 14, y);
  y += 8;

  doc.setFont('helvetica', 'bold').setFontSize(11);
  doc.text('Remitente', 14, y);
  y += 6;
  doc.setFont('helvetica', 'normal').setFontSize(10);
  const r = snapshot.remitente;
  doc.text(
    `${r.nombre} ${r.primerApellido} ${r.segundoApellido}`.trim(),
    14,
    y,
  );
  y += 5;
  doc.text(`${r.direccion}, ${r.codigoPostal} — ${r.localidad} (${r.provincia})`, 14, y);
  y += 5;
  doc.text(`Tel: ${r.prefijo} ${r.telefono}  ·  Email: ${r.email}`, 14, y);
  y += 5;
  doc.text(`Depósito: ${snapshot.pickup === 'Oficina' ? 'Recogida en oficina' : 'Recogida a domicilio'}`, 14, y);
  y += 5;
  doc.text('Etiqueta: Imprime en oficina LDH / servicio paquetería', 14, y);
  y += 10;

  doc.setFont('helvetica', 'bold').setFontSize(11);
  doc.text('Destinatario', 14, y);
  y += 6;
  doc.setFont('helvetica', 'normal').setFontSize(10);
  const d = snapshot.destinatario;
  doc.text(`${d.nombre} ${d.primerApellido} ${d.segundoApellido}`.trim(), 14, y);
  y += 5;
  doc.text(`Email: ${d.email}  ·  Tel: ${d.prefijo} ${d.telefono}`, 14, y);
  y += 5;
  if (snapshot.delivery === 'Oficina' && d.oficinaSeleccionada) {
    doc.text(`Entrega: Oficina — ${formatOficinaLabel(d.oficinaSeleccionada)}`, 14, y);
    y += 5;
    doc.text(formatOficinaDireccion(d.oficinaSeleccionada), 14, y);
  } else {
    doc.text('Entrega: Domicilio', 14, y);
    y += 5;
    doc.text(
      `${d.direccion}, ${d.codigoPostal} — ${d.localidad} (${d.provincia}), ${d.pais}`,
      14,
      y,
    );
  }
  y += 10;

  const { weight, size } = getPackageSummaryLines(snapshot.draft.packageTier);
  doc.setFont('helvetica', 'bold').setFontSize(11);
  doc.text('Envío / paquete', 14, y);
  y += 6;
  doc.setFont('helvetica', 'normal').setFontSize(10);
  doc.text(`Producto: ${snapshot.productTitle}`, 14, y);
  y += 5;
  doc.text(`Peso: ${weight}  ·  Tamaño: ${size}`, 14, y);
  y += 5;
  doc.text('Extras: —', 14, y);
  y += 10;

  doc.line(14, y, pageW - 14, y);
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Importes', 14, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Servicio (catálogo): ${money(snapshot.listPrice)}`, 14, y);
  y += 6;
  if (snapshot.paymentMethod === 'gratis') {
    doc.text('Ajuste método de prueba (sin cargo): ' + money(-snapshot.listPrice), 14, y);
    y += 6;
  }
  doc.setFont('helvetica', 'bold').setFontSize(12);
  doc.text(`TOTAL: ${money(snapshot.chargedTotal)}`, 14, y + 4);

  doc.setFontSize(8).setFont('helvetica', 'italic').setTextColor(100);
  doc.text(
    'Documento generado en el navegador (demo). Sustituir por facturación legal al conectar backend.',
    14,
    285,
  );

  doc.save(`LDH-factura-${snapshot.trackingNumber}.pdf`);
}

function labelPago(p: OrderSnapshot['paymentMethod']): string {
  switch (p) {
    case 'gratis':
      return 'Sin cargo (pruebas / desarrollo)';
    case 'bizum':
      return 'Bizum';
    case 'paypal':
      return 'PayPal';
    case 'tarjeta':
      return 'Tarjeta';
    default:
      return p;
  }
}
