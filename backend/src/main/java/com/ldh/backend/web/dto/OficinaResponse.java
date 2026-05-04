package com.ldh.backend.web.dto;

import java.time.Instant;

public record OficinaResponse(Long id, String name, String addressLine, String postalCode, String city, Double latitude,
		Double longitude, Instant createdAt) {
}
