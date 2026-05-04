package com.ldh.backend.web.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;

public record PricingQuoteRequest(
		@NotBlank String originCountry,
		String originPostalCode,
		@NotBlank String destinationCountry,
		String destinationPostalCode,
		boolean pickupOffice,
		boolean deliveryOffice,
		BigDecimal weightKg) {
}
