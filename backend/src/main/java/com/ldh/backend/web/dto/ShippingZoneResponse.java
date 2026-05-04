package com.ldh.backend.web.dto;

import java.util.List;

public record ShippingZoneResponse(
		Long id,
		String code,
		String name,
		boolean international,
		int displayOrder,
		String flagEmoji,
		List<ZonePrefixResponse> prefixes,
		long activeMatrixRuleCount) {
}
