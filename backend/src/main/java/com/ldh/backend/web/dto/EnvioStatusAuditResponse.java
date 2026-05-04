package com.ldh.backend.web.dto;

import java.time.Instant;

import com.ldh.backend.domain.EnvioStatus;

public record EnvioStatusAuditResponse(
		Long id,
		EnvioStatus oldStatus,
		EnvioStatus newStatus,
		Instant changedAt,
		Long actorUserId,
		String actorEmail,
		String notes) {
}
