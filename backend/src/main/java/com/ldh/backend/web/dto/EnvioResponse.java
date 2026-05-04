package com.ldh.backend.web.dto;

import java.time.Instant;

import com.ldh.backend.domain.EnvioStatus;

public record EnvioResponse(
		Long id,
		String trackingNumber,
		EnvioStatus status,
		String originAddress,
		String originPostalCode,
		String destinationAddress,
		String destinationPostalCode,
		Double packageWeightKg,
		Double packageLengthCm,
		Double packageWidthCm,
		Double packageHeightCm,
		String senderName,
		String senderPhone,
		String recipientName,
		String recipientPhone,
		Long totalAmountCents,
		String currency,
		String notes,
		Double currentLatitude,
		Double currentLongitude,
		String lastLocationLabel,
		String clientEmail,
		Long assignedRepartidorId,
		Instant createdAt,
		Instant updatedAt,
		String exceptionReason,
		String exceptionNotes) {
}
