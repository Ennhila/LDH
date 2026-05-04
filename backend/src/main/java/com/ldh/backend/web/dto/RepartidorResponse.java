package com.ldh.backend.web.dto;

public record RepartidorResponse(Long id, String email, String fullName, String postalCode, String phone,
		boolean enabled, boolean shiftActive) {
}
