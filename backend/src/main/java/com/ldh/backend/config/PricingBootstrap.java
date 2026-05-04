package com.ldh.backend.config;

import java.math.BigDecimal;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Queue;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.ldh.backend.domain.DeliveryTypeCode;
import com.ldh.backend.domain.DeliveryTypeModifier;
import com.ldh.backend.domain.PriceMatrixCell;
import com.ldh.backend.domain.ShippingZone;
import com.ldh.backend.domain.ZonePrefix;
import com.ldh.backend.repository.DeliveryTypeModifierRepository;
import com.ldh.backend.repository.PriceMatrixCellRepository;
import com.ldh.backend.repository.ShippingZoneRepository;

/**
 * Carga zonas, prefijos CP/ISO, modificadores de entrega y matriz base (referencia PRICING_FEATURE.md).
 */
@Component
@Order(100)
public class PricingBootstrap implements ApplicationRunner {

	private final ShippingZoneRepository zoneRepository;
	private final PriceMatrixCellRepository matrixRepository;
	private final DeliveryTypeModifierRepository modifierRepository;

	public PricingBootstrap(ShippingZoneRepository zoneRepository, PriceMatrixCellRepository matrixRepository,
			DeliveryTypeModifierRepository modifierRepository) {
		this.zoneRepository = zoneRepository;
		this.matrixRepository = matrixRepository;
		this.modifierRepository = modifierRepository;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		if (zoneRepository.count() > 0) {
			return;
		}
		List<ShippingZone> zones = createZones();
		zoneRepository.saveAll(zones);
		seedModifiers();
		List<ShippingZone> sorted = zoneRepository.findAllByOrderByDisplayOrderAscIdAsc();
		List<List<Integer>> adj = buildPeninsulaAdjacency();
		seedMatrix(sorted, adj);
	}

	private List<ShippingZone> createZones() {
		List<ZoneDef> defs = List.of(
				new ZoneDef("ZONE_1", "Comunidad de Madrid", false, 1, null, "28"),
				new ZoneDef("ZONE_2", "Centro (Castilla y León / CLM cercano)", false, 2, null,
						"05", "09", "16", "19", "34", "37", "40", "42", "45", "47", "49"),
				new ZoneDef("ZONE_3", "Norte", false, 3, null, "01", "20", "24", "26", "31", "33", "39", "48"),
				new ZoneDef("ZONE_4", "Noroeste (Galicia)", false, 4, null, "15", "27", "32", "36"),
				new ZoneDef("ZONE_5", "Aragón + La Rioja", false, 5, null, "22", "44", "50"),
				new ZoneDef("ZONE_6", "Catalunya", false, 6, null, "08", "17", "25", "43"),
				new ZoneDef("ZONE_7", "Levante", false, 7, null, "03", "12", "46"),
				new ZoneDef("ZONE_8", "Castilla-La Mancha Sur", false, 8, null, "02", "13"),
				new ZoneDef("ZONE_9", "Andalucía", false, 9, null, "04", "11", "14", "18", "21", "23", "29", "41"),
				new ZoneDef("ZONE_10", "Murcia + Extremadura", false, 10, null, "06", "10", "30"),
				new ZoneDef("ZONE_11", "Islas Baleares", false, 11, "🏝️", "07"),
				new ZoneDef("ZONE_12", "Islas Canarias", false, 12, "🌋", "35", "38"),
				new ZoneDef("ZONE_13", "Ceuta y Melilla", false, 13, "🇪🇦", "51", "52"),
				new ZoneDef("ZONE_INTL_WEST_EU", "Europa occidental", true, 14, "🇪🇺", "FR", "DE", "IT", "PT", "BE", "NL",
						"AT", "LU", "IE", "DK", "SE", "FI", "PL", "CZ", "SK", "HU", "SI", "HR", "GR", "CY", "MT", "EE",
						"LV", "LT", "BG", "RO"),
				new ZoneDef("ZONE_INTL_EAST_EU", "Europa oriental", true, 15, "🇪🇺", "AL", "BA", "RS", "ME", "MK", "XK"),
				new ZoneDef("ZONE_INTL_NORTH_AFRICA", "Norte de África", true, 16, "🌍", "MA", "DZ", "TN", "LY", "EG"),
				new ZoneDef("ZONE_INTL_REST_AFRICA", "Resto de África", true, 17, "🌍", "ZA", "NG", "KE", "GH"),
				new ZoneDef("ZONE_INTL_ASIA", "Asia", true, 18, "🌏", "CN", "JP", "KR", "IN", "ID", "TH", "VN", "MY",
						"SG", "PH"),
				new ZoneDef("ZONE_INTL_NORTH_AM", "Norteamérica", true, 19, "🇺🇸", "US", "CA", "MX"),
				new ZoneDef("ZONE_INTL_SOUTH_AM", "Sudamérica", true, 20, "🌎", "AR", "BR", "CL", "CO", "PE"));

		List<ShippingZone> out = new ArrayList<>();
		for (ZoneDef d : defs) {
			ShippingZone z = new ShippingZone();
			z.setCode(d.code);
			z.setName(d.name);
			z.setInternational(d.international);
			z.setDisplayOrder(d.order);
			z.setFlagEmoji(d.flag);
			for (String p : d.prefixes) {
				ZonePrefix zp = new ZonePrefix();
				zp.setPrefix(p);
				zp.setZone(z);
				z.getPrefixes().add(zp);
			}
			out.add(z);
		}
		return out;
	}

	private void seedModifiers() {
		modifierRepository.save(mod("Oficina → Oficina", DeliveryTypeCode.OFFICE_OFFICE, "1.0000", "0.00"));
		modifierRepository.save(mod("Oficina → Domicilio", DeliveryTypeCode.OFFICE_HOME, "1.2000", "0.50"));
		modifierRepository.save(mod("Domicilio → Oficina", DeliveryTypeCode.HOME_OFFICE, "1.2000", "0.50"));
		modifierRepository.save(mod("Domicilio → Domicilio", DeliveryTypeCode.HOME_HOME, "1.4500", "1.00"));
	}

	private DeliveryTypeModifier mod(String label, DeliveryTypeCode code, String mult, String flat) {
		DeliveryTypeModifier m = new DeliveryTypeModifier();
		m.setLabel(label);
		m.setCode(code);
		m.setMultiplier(new BigDecimal(mult));
		m.setFlatSurcharge(new BigDecimal(flat));
		m.setActive(true);
		return m;
	}

	private void seedMatrix(List<ShippingZone> zones, List<List<Integer>> adj) {
		int n = zones.size();
		for (int i = 0; i < n; i++) {
			ShippingZone o = zones.get(i);
			for (int j = 0; j < n; j++) {
				ShippingZone d = zones.get(j);
				BigDecimal base = computeSeedBase(i, j, n, adj);
				PriceMatrixCell cell = new PriceMatrixCell();
				cell.setOriginZone(o);
				cell.setDestZone(d);
				cell.setBasePrice(base);
				cell.setPricePerKgOver1(new BigDecimal("0.40"));
				cell.setPricePerKgOver5(new BigDecimal("0.28"));
				cell.setPricePerKgOver20(new BigDecimal("0.18"));
				cell.setFuelSurcharge(i != j ? new BigDecimal("0.35") : BigDecimal.ZERO);
				cell.setRemoteAreaSurcharge(BigDecimal.ZERO);
				cell.setActive(true);
				matrixRepository.save(cell);
			}
		}
	}

	private BigDecimal computeSeedBase(int i, int j, int n, List<List<Integer>> adj) {
		if (i == j) {
			return new BigDecimal("2.00");
		}
		boolean spainI = i < 13;
		boolean spainJ = j < 13;
		if (spainI && spainJ) {
			if (j == 10 || i == 10) {
				return new BigDecimal("12.50");
			}
			if (j == 11 || i == 11) {
				return new BigDecimal("18.00");
			}
			if (j == 12 || i == 12) {
				return new BigDecimal("15.00");
			}
			int h = shortestPath(adj, i, j);
			return tierForHops(h);
		}
		if (spainI != spainJ) {
			int intlIdx = spainI ? j : i;
			BigDecimal[] spainToIntl = { new BigDecimal("22.00"), new BigDecimal("38.00"), new BigDecimal("32.00"),
					new BigDecimal("58.00"), new BigDecimal("88.00"), new BigDecimal("101.00"), new BigDecimal("79.00") };
			return spainToIntl[intlIdx - 13];
		}
		return new BigDecimal("48.00");
	}

	private BigDecimal tierForHops(int h) {
		if (h <= 0) {
			return new BigDecimal("2.00");
		}
		if (h == 1) {
			return new BigDecimal("5.50");
		}
		if (h <= 3) {
			return new BigDecimal("7.90");
		}
		return new BigDecimal("9.90");
	}

	private int shortestPath(List<List<Integer>> adj, int from, int to) {
		if (from == to) {
			return 0;
		}
		int[] dist = new int[13];
		Arrays.fill(dist, -1);
		Queue<Integer> q = new ArrayDeque<>();
		dist[from] = 0;
		q.add(from);
		while (!q.isEmpty()) {
			int u = q.poll();
			for (int v : adj.get(u)) {
				if (dist[v] == -1) {
					dist[v] = dist[u] + 1;
					if (v == to) {
						return dist[v];
					}
					q.add(v);
				}
			}
		}
		return 5;
	}

	private List<List<Integer>> buildPeninsulaAdjacency() {
		List<List<Integer>> adj = new ArrayList<>();
		for (int i = 0; i < 13; i++) {
			adj.add(new ArrayList<>());
		}
		bi(adj, 0, 1);
		bi(adj, 1, 2);
		bi(adj, 1, 3);
		bi(adj, 1, 4);
		bi(adj, 1, 5);
		bi(adj, 1, 6);
		bi(adj, 1, 7);
		bi(adj, 1, 8);
		bi(adj, 1, 9);
		bi(adj, 2, 3);
		bi(adj, 2, 4);
		bi(adj, 3, 4);
		bi(adj, 4, 5);
		bi(adj, 4, 6);
		bi(adj, 5, 6);
		bi(adj, 6, 7);
		bi(adj, 6, 8);
		bi(adj, 6, 9);
		bi(adj, 6, 10);
		bi(adj, 7, 8);
		bi(adj, 7, 9);
		bi(adj, 8, 9);
		bi(adj, 8, 11);
		bi(adj, 9, 11);
		bi(adj, 8, 12);
		bi(adj, 9, 12);
		return adj;
	}

	private void bi(List<List<Integer>> adj, int a, int b) {
		adj.get(a).add(b);
		adj.get(b).add(a);
	}

	private record ZoneDef(String code, String name, boolean international, int order, String flag, String... prefixes) {
	}
}
