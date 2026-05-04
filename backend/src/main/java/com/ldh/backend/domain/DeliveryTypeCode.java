package com.ldh.backend.domain;

/**
 * Combinación recogida × entrega. Orden de coste: OFFICE_OFFICE &lt; OFFICE_HOME ≈ HOME_OFFICE &lt; HOME_HOME.
 */
public enum DeliveryTypeCode {
	OFFICE_OFFICE,
	OFFICE_HOME,
	HOME_OFFICE,
	HOME_HOME;

	public static DeliveryTypeCode fromPickupDelivery(boolean pickupOffice, boolean deliveryOffice) {
		if (pickupOffice && deliveryOffice) {
			return OFFICE_OFFICE;
		}
		if (pickupOffice) {
			return OFFICE_HOME;
		}
		if (deliveryOffice) {
			return HOME_OFFICE;
		}
		return HOME_HOME;
	}
}
