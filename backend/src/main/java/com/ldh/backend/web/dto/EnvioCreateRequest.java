package com.ldh.backend.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EnvioCreateRequest(
		@Size(max = 512) String originAddress,
		@Size(max = 16) String originPostalCode,
		@Size(max = 512) String destinationAddress,
		@NotBlank @Size(min = 3, max = 16) String destinationPostalCode,
		Double packageWeightKg,
		Double packageLengthCm,
		Double packageWidthCm,
		Double packageHeightCm,
		@Size(max = 255) String senderName,
		@Size(max = 32) String senderPhone,
		@Size(max = 255) String recipientName,
		@Size(max = 32) String recipientPhone,
		Long totalAmountCents,
		@Size(max = 1024) String notes,
		/** JSON opcional para reconstruir factura/etiqueta en el cliente (máx. ~512 KB en servicio). */
		String checkoutSnapshotJson) {
}
