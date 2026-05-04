package com.ldh.backend.web.dto;

import com.ldh.backend.domain.EnvioStatus;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record EnvioStatusUpdateRequest(
		@NotNull EnvioStatus status,
		Double currentLatitude,
		Double currentLongitude,
		@Size(max = 255) String lastLocationLabel,
		@Size(max = 255) String exceptionReason,
		@Size(max = 4000) String exceptionNotes) {
}
