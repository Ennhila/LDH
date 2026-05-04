package com.ldh.backend.web.dto;

import java.math.BigDecimal;

public record DeliveryModifierPatchRequest(
		BigDecimal multiplier,
		BigDecimal flatSurcharge,
		Boolean active,
		String label) {
}
