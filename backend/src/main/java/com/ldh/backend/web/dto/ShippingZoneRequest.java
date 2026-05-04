package com.ldh.backend.web.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ShippingZoneRequest(
		@NotBlank String code,
		@NotBlank String name,
		@NotNull Boolean international,
		@NotNull Integer displayOrder,
		String flagEmoji,
		List<String> prefixes) {
}
