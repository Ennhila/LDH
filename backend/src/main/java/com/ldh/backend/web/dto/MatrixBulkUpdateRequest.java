package com.ldh.backend.web.dto;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

public record MatrixBulkUpdateRequest(@NotEmpty List<BulkCell> cells) {

	public record BulkCell(
			@NotNull Long originZoneId,
			@NotNull Long destZoneId,
			@NotNull BigDecimal basePrice) {
	}
}
