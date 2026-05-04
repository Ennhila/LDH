import { readShippingDraftFromWindow } from '../shipping-wizard/draft';
import { readDestinatarioDraft } from '../shipping-wizard/destinatario-storage';
import { readRemitenteDraft } from '../shipping-wizard/remitente-storage';
import { getShippingOptionById } from '../shipping-wizard/shippingOptions';
import type {
  DestinatarioDraft,
  PickupDeliveryType,
  RemitenteDraft,
  ShippingDraft,
  ShippingOption,
} from '../shipping-wizard/types';

export type PaymentMethodId = 'gratis' | 'bizum' | 'paypal' | 'tarjeta';

export type OrderSnapshot = {
  trackingNumber: string;
  createdAtIso: string;
  paymentMethod: PaymentMethodId;
  draft: ShippingDraft;
  remitente: RemitenteDraft;
  destinatario: DestinatarioDraft;
  productTitle: string;
  /** Precio de catálogo del servicio */
  listPrice: number;
  /** Importe cobrado (0 si método gratis / pruebas) */
  chargedTotal: number;
  pickup: PickupDeliveryType;
  delivery: PickupDeliveryType;
};

const SNAPSHOT_KEY = 'ldh_completed_order_snapshot';

function snapshotKeyForTracking(trackingNumber: string): string {
  return `ldh_order_track_${trackingNumber}`;
}

export function generateTrackingNumber(): string {
  const part = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `LDH-${part}`;
}

export function buildOrderSnapshotFromWizard(
  paymentMethod: PaymentMethodId,
  trackingNumber: string,
  /** Preferir la opción en pantalla; evita fallar si sessionStorage se vació (p. ej. guard de tipo de entrega). */
  selectedOptionOverride?: ShippingOption,
): OrderSnapshot | null {
  if (typeof window === 'undefined') return null;
  const draft = readShippingDraftFromWindow();
  const remitente = readRemitenteDraft();
  const destinatario = readDestinatarioDraft();
  const raw = sessionStorage.getItem('ldh_shipping_selected_option_id');
  const id = raw ? Number(raw) : NaN;
  const opt =
    selectedOptionOverride ??
    (Number.isFinite(id) ? getShippingOptionById(id) : undefined);
  if (!opt) return null;

  const listPrice = opt.price;
  const chargedTotal = paymentMethod === 'gratis' ? 0 : listPrice;

  return {
    trackingNumber,
    createdAtIso: new Date().toISOString(),
    paymentMethod,
    draft,
    remitente,
    destinatario,
    productTitle: opt.title,
    listPrice,
    chargedTotal,
    pickup: opt.pickup,
    delivery: opt.delivery,
  };
}

export function persistCompletedOrderSnapshot(s: OrderSnapshot): void {
  const raw = JSON.stringify(s);
  const byTrack = snapshotKeyForTracking(s.trackingNumber);
  try {
    sessionStorage.setItem(SNAPSHOT_KEY, raw);
    sessionStorage.setItem(byTrack, raw);
  } catch (e) {
    console.warn('[LDH] sessionStorage pedido:', e);
  }
  try {
    localStorage.setItem(SNAPSHOT_KEY, raw);
    localStorage.setItem(byTrack, raw);
  } catch (e) {
    console.warn('[LDH] localStorage pedido:', e);
  }
}

function readRawSnapshot(): string | null {
  if (typeof window !== 'undefined') {
    const t = new URLSearchParams(window.location.search).get('t');
    if (t) {
      const key = snapshotKeyForTracking(decodeURIComponent(t));
      const byTrack = sessionStorage.getItem(key) ?? localStorage.getItem(key);
      if (byTrack) return byTrack;
    }
  }
  return sessionStorage.getItem(SNAPSHOT_KEY) ?? localStorage.getItem(SNAPSHOT_KEY) ?? null;
}

/** Reconstruye el snapshot para PDFs a partir de lo guardado en el servidor al crear el envío. */
export function orderSnapshotFromServerPayload(
  trackingNumber: string,
  createdAtIso: string,
  snapshotPayloadJson: string,
): OrderSnapshot | null {
  try {
    const p = JSON.parse(snapshotPayloadJson) as Partial<OrderSnapshot>;
    if (
      p.paymentMethod == null ||
      p.draft == null ||
      p.remitente == null ||
      p.destinatario == null ||
      p.productTitle == null ||
      p.listPrice == null ||
      p.chargedTotal == null ||
      p.pickup == null ||
      p.delivery == null
    ) {
      return null;
    }
    return {
      trackingNumber,
      createdAtIso,
      paymentMethod: p.paymentMethod,
      draft: p.draft,
      remitente: p.remitente,
      destinatario: p.destinatario,
      productTitle: p.productTitle,
      listPrice: p.listPrice,
      chargedTotal: p.chargedTotal,
      pickup: p.pickup,
      delivery: p.delivery,
    };
  } catch {
    return null;
  }
}

export function readCompletedOrderSnapshot(): OrderSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = readRawSnapshot();
    if (!raw) return null;
    return JSON.parse(raw) as OrderSnapshot;
  } catch {
    return null;
  }
}

