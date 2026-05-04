package com.ldh.backend.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ldh.backend.service.DashboardService;
import com.ldh.backend.web.dto.AdminDashboardChartsResponse;
import com.ldh.backend.web.dto.DashboardStatsResponse;

@RestController
@RequestMapping("/api/admin/dashboard")
public class AdminDashboardController {

	private final DashboardService dashboardService;

	public AdminDashboardController(DashboardService dashboardService) {
		this.dashboardService = dashboardService;
	}

	@GetMapping("/stats")
	public DashboardStatsResponse stats() {
		return dashboardService.stats();
	}

	@GetMapping("/charts")
	public AdminDashboardChartsResponse charts() {
		return dashboardService.charts();
	}
}
