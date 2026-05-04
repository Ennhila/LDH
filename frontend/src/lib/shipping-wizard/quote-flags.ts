import type { DeliveryTypeCode } from '../../types/api';

/** Alineado con `DeliveryTypeCode.fromPickupDelivery` en el backend. */
export function quoteFlagsForDeliveryType(code: DeliveryTypeCode): {
  pickupOffice: boolean;
  deliveryOffice: boolean;
} {
  switch (code) {
    case 'OFFICE_OFFICE':
      return { pickupOffice: true, deliveryOffice: true };
    case 'OFFICE_HOME':
      return { pickupOffice: true, deliveryOffice: false };
    case 'HOME_OFFICE':
      return { pickupOffice: false, deliveryOffice: true };
    case 'HOME_HOME':
      return { pickupOffice: false, deliveryOffice: false };
  }
}
