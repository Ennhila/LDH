package com.ldh.backend.web.dto;

import com.ldh.backend.validation.SpanishPostalCode;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record OficinaRequest(
		@NotBlank @Size(max = 255) String name,
		@NotBlank @Size(max = 512) String addressLine,
		@NotBlank @SpanishPostalCode String postalCode,
		@NotBlank @Size(max = 128) String city,
		Double latitude,
		Double longitude) {
}
