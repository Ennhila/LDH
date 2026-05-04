package com.ldh.backend.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ldh.backend.domain.Envio;
import com.ldh.backend.domain.EnvioStatus;
import com.ldh.backend.domain.Role;
import com.ldh.backend.repository.EnvioRepository;
import com.ldh.backend.repository.OficinaRepository;
import com.ldh.backend.repository.UserRepository;
import com.ldh.backend.web.dto.AdminDashboardChartsResponse;
import com.ldh.backend.web.dto.AdminDashboardChartsResponse.DayCount;
import com.ldh.backend.web.dto.AdminDashboardChartsResponse.DayMoney;
import com.ldh.backend.web.dto.AdminDashboardChartsResponse.StatusCount;
import com.ldh.backend.web.dto.DashboardStatsResponse;
import com.ldh.backend.web.dto.DashboardStatsResponse.PeriodStats;

@Service
public class DashboardService {

	private final UserRepository userRepository;
	private final OficinaRepository oficinaRepository;
	private final EnvioRepository envioRepository;

	public DashboardService(UserRepository userRepository, OficinaRepository oficinaRepository,
			EnvioRepository envioRepository) {
		this.userRepository = userRepository;
		this.oficinaRepository = oficinaRepository;
		this.envioRepository = envioRepository;
	}

	@Transactional(readOnly = true)
	public DashboardStatsResponse stats() {
		long repTotal = userRepository.countByRole(Role.REPARTIDOR);
		long repActive = userRepository.countByRoleAndShiftActiveIsTrue(Role.REPARTIDOR);
		long oficinas = oficinaRepository.count();
		Instant now = Instant.now();
		Instant d7 = now.minus(7, ChronoUnit.DAYS);
		Instant d30 = now.minus(30, ChronoUnit.DAYS);
		Instant d90 = now.minus(90, ChronoUnit.DAYS);
		PeriodStats envios = new PeriodStats(
				envioRepository.countCreatedSince(d7),
				envioRepository.countCreatedSince(d30),
				envioRepository.countCreatedSince(d90));
		PeriodStats ingresos = new PeriodStats(
				envioRepository.sumTotalAmountCentsSinceDelivered(d7, EnvioStatus.DELIVERED),
				envioRepository.sumTotalAmountCentsSinceDelivered(d30, EnvioStatus.DELIVERED),
				envioRepository.sumTotalAmountCentsSinceDelivered(d90, EnvioStatus.DELIVERED));
		return new DashboardStatsResponse(repTotal, repActive, oficinas, envios, ingresos);
	}

	@Transactional(readOnly = true)
	public AdminDashboardChartsResponse charts() {
		Instant since = Instant.now().minus(30, ChronoUnit.DAYS);
		List<Envio> created = envioRepository.findByCreatedAtGreaterThanEqual(since);
		Map<LocalDate, Long> byCreatedDay = new TreeMap<>();
		for (Envio e : created) {
			LocalDate d = LocalDate.ofInstant(e.getCreatedAt(), ZoneOffset.UTC);
			byCreatedDay.merge(d, 1L, Long::sum);
		}
		List<DayCount> enviosCreatedByDay = byCreatedDay.entrySet().stream()
				.map(en -> new DayCount(en.getKey().toString(), en.getValue()))
				.toList();

		List<Object[]> statusRows = envioRepository.countGroupedByStatus();
		List<StatusCount> enviosByStatus = statusRows.stream()
				.map(row -> new StatusCount(((EnvioStatus) row[0]).name(), toLong(row[1])))
				.toList();

		List<Envio> delivered = envioRepository.findByStatusAndUpdatedAtGreaterThanEqual(EnvioStatus.DELIVERED, since);
		Map<LocalDate, Long> moneyByDay = new TreeMap<>();
		for (Envio e : delivered) {
			Long cents = e.getTotalAmountCents();
			if (cents != null && cents > 0) {
				LocalDate d = LocalDate.ofInstant(e.getUpdatedAt(), ZoneOffset.UTC);
				moneyByDay.merge(d, cents, Long::sum);
			}
		}
		List<DayMoney> ingresosDeliveredByDay = moneyByDay.entrySet().stream()
				.map(en -> new DayMoney(en.getKey().toString(), en.getValue()))
				.toList();

		return new AdminDashboardChartsResponse(enviosCreatedByDay, enviosByStatus, ingresosDeliveredByDay);
	}

	private static long toLong(Object o) {
		if (o instanceof Long l) {
			return l;
		}
		if (o instanceof Number n) {
			return n.longValue();
		}
		return 0L;
	}
}
