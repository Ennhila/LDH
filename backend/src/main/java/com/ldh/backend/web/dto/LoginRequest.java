package com.ldh.backend.web.dto;

import com.ldh.backend.validation.RealisticEmail;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
		@NotBlank @RealisticEmail String email,
		@NotBlank String password) {
}
