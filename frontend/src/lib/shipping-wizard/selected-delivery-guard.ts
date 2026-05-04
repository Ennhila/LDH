import { fetchActiveDeliveryTypeCodes } from '../public-pricing';
import { getShippingOptionById } from './shippingOptions';

const SELECTED_OPTION_KEY = 'ldh_shipping_selected_option_id';

/**
 * Si la opción guardada no existe o su tipo de entrega está desactivado en admin,
 * limpia la selección y vuelve al paso 1.
 */
export async function redirectIfSelectedDeliveryTypeInactive(): Promise<void> {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(SELECTED_OPTION_KEY);
  } catch {
    window.location.replace('/envio/paso-1');
    return;
  }
  if (!raw) {
    window.location.replace('/envio/paso-1');
    return;
  }
  const id = Number(raw);
  const opt = getShippingOptionById(id);
  if (!opt) {
    try {
      sessionStorage.removeItem(SELECTED_OPTION_KEY);
    } catch {
      /* ignore */
    }
    window.location.replace('/envio/paso-1');
    return;
  }
  const active = await fetchActiveDeliveryTypeCodes();
  if (!active.has(opt.deliveryTypeCode)) {
    try {
      sessionStorage.removeItem(SELECTED_OPTION_KEY);
    } catch {
      /* ignore */
    }
    window.location.replace('/envio/paso-1');
  }
}
