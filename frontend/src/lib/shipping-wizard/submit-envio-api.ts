import { apiFetch } from '../api';
import type { Envio as ApiEnvio } from '../../types/api';
import type { PaymentMethodId } from '../pdf/order-snapshot';
import { isSpainPostalCode } from '../validation/inputs';
import { formatOficinaDireccion, formatOficinaLabel } from './mock-oficinas';
import { PACKAGE_SPECS } from './packageSpecs';
import type { DestinatarioDraft, RemitenteDraft, ShippingDraft, ShippingOption } from './types';

function buildCheckoutSnapshotJson(
  draft: ShippingDraft,
  remitente: RemitenteDraft,
  destinatario: DestinatarioDraft,
  selectedOption: ShippingOption,
  payment: PaymentMethodId,
): string {
  const listPrice = selectedOption.price;
  const chargedTotal = payment === 'gratis' ? 0 : listPrice;
  return JSON.stringify({
    paymentMethod: payment,
    draft,
    remitente,
    destinatario,
    productTitle: selectedOption.title,
    listPrice,
    chargedTotal,
    pickup: selectedOption.pickup,
    delivery: selectedOption.delivery,
  });
}

function normalizeSpainCp(raw: string): string | undefined {
  const n = raw.replace(/\D/g, '').slice(0, 5);
  if (n.length === 5 && isSpainPostalCode(n)) return n;
  return undefined;
}

function parseSizeCm(sizeLabel: string): { length: number; width: number; height: number } {
  const m = sizeLabel.match(/(\d+)\s*[×x]\s*(\d+)\s*[×x]\s*(\d+)/i);
  if (!m) return { length: 30, width: 20, height: 20 };
  return { length: Number(m[1]), width: Number(m[2]), height: Number(m[3]) };
}

function tierMaxKg(tier: ShippingDraft['packageTier']): number {
  const map: Record<ShippingDraft['packageTier'], number> = { '2kg': 2, '5kg': 5, '10kg': 10, '20kg': 20 };
  return map[tier];
}

export function buildEnvioCreateBody(
  draft: ShippingDraft,
  remitente: RemitenteDraft,
  destinatario: DestinatarioDraft,
  selectedOption: ShippingOption,
  payment: PaymentMethodId,
): Record<string, unknown> {
  const specs = PACKAGE_SPECS[draft.packageTier];
  const { length, width, height } = parseSizeCm(specs.sizeLabel);
  const listPrice = selectedOption.price;
  const chargedTotal = payment === 'gratis' ? 0 : listPrice;
  const totalAmountCents =
    chargedTotal > 0 ? Math.round(chargedTotal * 100) : null;

  const officeDest = selectedOption.delivery === 'Oficina' && destinatario.oficinaSeleccionada;
  const destinationPostalCode = officeDest
    ? destinatario.oficinaSeleccionada!.codigoPostal.trim().slice(0, 16)
    : destinatario.pais === 'España'
      ? normalizeSpainCp(destinatario.codigoPostal) ?? destinatario.codigoPostal.trim().slice(0, 16)
      : destinatario.codigoPostal.trim().slice(0, 16);
  const destinationAddress = officeDest
    ? `${formatOficinaLabel(destinatario.oficinaSeleccionada!)} — ${formatOficinaDireccion(destinatario.oficinaSeleccionada!)}`
    : [
        `${destinatario.direccion}, ${destinatario.localidad} (${destinatario.provincia})`.trim(),
        destinatario.pais !== 'España' ? destinatario.pais : '',
      ]
        .filter(Boolean)
        .join(', ');

  const originPostal =
    remitente.pais === 'España'
      ? normalizeSpainCp(remitente.codigoPostal)
      : (() => {
          const o = remitente.codigoPostal.trim();
          return o ? o.slice(0, 16) : undefined;
        })();
  const senderName = `${remitente.nombre} ${remitente.primerApellido} ${remitente.segundoApellido}`.trim();
  const recipientName = `${destinatario.nombre} ${destinatario.primerApellido} ${destinatario.segundoApellido}`.trim();
  const senderPhone = `${remitente.prefijo}${remitente.telefono}`.replace(/\s+/g, '').slice(0, 32);
  const recipientPhone = `${destinatario.prefijo}${destinatario.telefono}`.replace(/\s+/g, '').slice(0, 32);

  const notes = [
    `Servicio: ${selectedOption.title}`,
    `Pago: ${payment}`,
    `Recogida: ${selectedOption.pickup} · Entrega: ${selectedOption.delivery}`,
  ].join(' · ');

  const originAddress = [
    `${remitente.direccion}, ${remitente.localidad} (${remitente.provincia})`.trim(),
    remitente.pais !== 'España' ? remitente.pais : '',
  ]
    .filter(Boolean)
    .join(', ');

  const body: Record<string, unknown> = {
    originAddress,
    destinationAddress: destinationAddress || null,
    destinationPostalCode,
    packageWeightKg: tierMaxKg(draft.packageTier),
    packageLengthCm: length,
    packageWidthCm: width,
    packageHeightCm: height,
    senderName,
    senderPhone,
    recipientName,
    recipientPhone,
    totalAmountCents,
    notes,
  };

  if (originPostal) body.originPostalCode = originPostal;

  return body;
}

export async function submitClientEnvioFromWizard(
  draft: ShippingDraft,
  remitente: RemitenteDraft,
  destinatario: DestinatarioDraft,
  selectedOption: ShippingOption,
  payment: PaymentMethodId,
): Promise<ApiEnvio> {
  const payload = buildEnvioCreateBody(draft, remitente, destinatario, selectedOption, payment);
  payload.checkoutSnapshotJson = buildCheckoutSnapshotJson(
    draft,
    remitente,
    destinatario,
    selectedOption,
    payment,
  );
  return apiFetch<ApiEnvio>('/api/client/envios', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
