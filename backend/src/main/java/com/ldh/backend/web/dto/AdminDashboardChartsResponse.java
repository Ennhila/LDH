package com.ldh.backend.web.dto;

import java.util.List;

public record AdminDashboardChartsResponse(
		List<DayCount> enviosCreatedByDay,
		List<StatusCount> enviosByStatus,
		List<DayMoney> ingresosDeliveredByDay) {

	public record DayCount(String date, long count) {
	}

	public record StatusCount(String status, long count) {
	}

	public record DayMoney(String date, long amountCents) {
	}
}
