package com.ldh.backend.web.dto;

import java.math.BigDecimal;

public record PricingQuoteResponse(
		Long originZoneId,
		String originZoneCode,
		String originZoneName,
		Long destZoneId,
		String destZoneCode,
		String destZoneName,
		String deliveryTypeCode,
		BigDecimal baseComponent,
		BigDecimal weightComponent,
		BigDecimal fuelSurcharge,
		BigDecimal remoteAreaSurcharge,
		BigDecimal deliveryMultiplier,
		BigDecimal deliveryFlatSurcharge,
		BigDecimal totalEur) {
}
