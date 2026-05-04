package com.ldh.backend.web.dto;

import com.ldh.backend.validation.RealisticEmail;
import com.ldh.backend.validation.SpanishPostalCode;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateRepartidorRequest(
		@NotBlank @RealisticEmail String email,
		@NotBlank @Size(max = 255) String fullName,
		@NotBlank @SpanishPostalCode String postalCode,
		@Size(max = 32) String phone) {
}
