package com.ldh.backend.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PriceMatrixCellPatchRequest(
		BigDecimal basePrice,
		BigDecimal pricePerKgOver1,
		BigDecimal pricePerKgOver5,
		BigDecimal pricePerKgOver20,
		BigDecimal fuelSurcharge,
		BigDecimal remoteAreaSurcharge,
		LocalDate validFrom,
		LocalDate validTo,
		Boolean active) {
}
