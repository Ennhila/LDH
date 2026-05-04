package com.ldh.backend.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PriceMatrixCellResponse(
		Long id,
		Long originZoneId,
		String originZoneCode,
		Long destZoneId,
		String destZoneCode,
		BigDecimal basePrice,
		BigDecimal pricePerKgOver1,
		BigDecimal pricePerKgOver5,
		BigDecimal pricePerKgOver20,
		BigDecimal fuelSurcharge,
		BigDecimal remoteAreaSurcharge,
		LocalDate validFrom,
		LocalDate validTo,
		boolean active) {
}
