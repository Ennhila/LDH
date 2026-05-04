package com.ldh.backend.web.dto;

import java.math.BigDecimal;

public record DeliveryModifierResponse(
		Long id,
		String code,
		String label,
		BigDecimal multiplier,
		BigDecimal flatSurcharge,
		boolean active) {
}
