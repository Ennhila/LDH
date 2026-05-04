package com.ldh.backend.web.dto;

public record DashboardStatsResponse(
		long repartidoresTotal,
		long repartidoresActivos,
		long oficinasTotal,
		PeriodStats envios,
		PeriodStats ingresosCents) {

	public record PeriodStats(long last7Days, long last30Days, long last90Days) {
	}
}
