package com.ldh.backend.service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.ldh.backend.domain.DeliveryTypeCode;
import com.ldh.backend.domain.DeliveryTypeModifier;
import com.ldh.backend.domain.PriceMatrixCell;
import com.ldh.backend.domain.Role;
import com.ldh.backend.domain.ShippingZone;
import com.ldh.backend.domain.User;
import com.ldh.backend.domain.ZonePrefix;
import com.ldh.backend.repository.DeliveryTypeModifierRepository;
import com.ldh.backend.repository.OficinaRepository;
import com.ldh.backend.repository.PriceMatrixCellRepository;
import com.ldh.backend.repository.ShippingZoneRepository;
import com.ldh.backend.repository.UserRepository;
import com.ldh.backend.repository.ZonePrefixRepository;
import com.ldh.backend.web.dto.AddPrefixRequest;
import com.ldh.backend.web.dto.DeliveryModifierPatchRequest;
import com.ldh.backend.web.dto.DeliveryModifierResponse;
import com.ldh.backend.web.dto.MatrixBulkUpdateRequest;
import com.ldh.backend.web.dto.OficinaInZoneResponse;
import com.ldh.backend.web.dto.PriceMatrixCellPatchRequest;
import com.ldh.backend.web.dto.PriceMatrixCellResponse;
import com.ldh.backend.web.dto.RepartidorInZoneResponse;
import com.ldh.backend.web.dto.ShippingZoneRequest;
import com.ldh.backend.web.dto.ShippingZoneResponse;
import com.ldh.backend.web.dto.ZonePrefixResponse;

@Service
public class PricingAdminService {

	private final ShippingZoneRepository zoneRepository;
	private final ZonePrefixRepository prefixRepository;
	private final PriceMatrixCellRepository matrixRepository;
	private final DeliveryTypeModifierRepository modifierRepository;
	private final OficinaRepository oficinaRepository;
	private final UserRepository userRepository;

	public PricingAdminService(ShippingZoneRepository zoneRepository, ZonePrefixRepository prefixRepository,
			PriceMatrixCellRepository matrixRepository, DeliveryTypeModifierRepository modifierRepository,
			OficinaRepository oficinaRepository, UserRepository userRepository) {
		this.zoneRepository = zoneRepository;
		this.prefixRepository = prefixRepository;
		this.matrixRepository = matrixRepository;
		this.modifierRepository = modifierRepository;
		this.oficinaRepository = oficinaRepository;
		this.userRepository = userRepository;
	}

	@Transactional(readOnly = true)
	public List<ShippingZoneResponse> listZones() {
		return zoneRepository.findAllWithPrefixesOrdered().stream().map(this::toZoneResponse).toList();
	}

	private ShippingZoneResponse toZoneResponse(ShippingZone z) {
		List<ZonePrefixResponse> prefs = z.getPrefixes().stream()
				.sorted(Comparator.comparing(ZonePrefix::getPrefix))
				.map(p -> new ZonePrefixResponse(p.getId(), p.getPrefix()))
				.toList();
		long cnt = matrixRepository.countActiveCellsTouchingZone(z.getId());
		return new ShippingZoneResponse(z.getId(), z.getCode(), z.getName(), z.isInternational(), z.getDisplayOrder(),
				z.getFlagEmoji(), prefs, cnt);
	}

	@Transactional
	public ShippingZoneResponse createZone(ShippingZoneRequest req) {
		if (zoneRepository.findByCode(req.code()).isPresent()) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Código de zona ya existe");
		}
		ShippingZone z = new ShippingZone();
		applyZoneFields(z, req);
		z = zoneRepository.save(z);
		if (req.prefixes() != null) {
			for (String p : req.prefixes()) {
				addPrefixEntity(z, p);
			}
			z = zoneRepository.save(z);
		}
		return toZoneResponse(zoneRepository.fetchWithPrefixes(z.getId()).orElseThrow());
	}

	@Transactional
	public ShippingZoneResponse updateZone(Long id, ShippingZoneRequest req) {
		ShippingZone z = zoneRepository.fetchWithPrefixes(id).orElseThrow(() -> notFound());
		if (!z.getCode().equals(req.code()) && zoneRepository.findByCode(req.code()).isPresent()) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Código de zona ya existe");
		}
		applyZoneFields(z, req);
		if (req.prefixes() != null) {
			z.getPrefixes().clear();
			for (String p : req.prefixes()) {
				addPrefixEntity(z, p);
			}
		}
		z = zoneRepository.save(z);
		return toZoneResponse(zoneRepository.fetchWithPrefixes(z.getId()).orElseThrow());
	}

	private void applyZoneFields(ShippingZone z, ShippingZoneRequest req) {
		z.setCode(req.code());
		z.setName(req.name());
		z.setInternational(req.international());
		z.setDisplayOrder(req.displayOrder());
		z.setFlagEmoji(req.flagEmoji());
	}

	private void addPrefixEntity(ShippingZone z, String raw) {
		String p = raw.trim();
		if (p.isEmpty()) {
			return;
		}
		if (prefixRepository.existsByZoneIdAndPrefixIgnoreCase(z.getId(), p)) {
			return;
		}
		if (prefixRepository.findByPrefixIgnoreCase(p).filter(existing -> !existing.getZone().getId().equals(z.getId()))
				.isPresent()) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Prefijo ya asignado a otra zona: " + p);
		}
		ZonePrefix zp = new ZonePrefix();
		zp.setPrefix(z.isInternational() ? p.toUpperCase() : p);
		zp.setZone(z);
		z.getPrefixes().add(zp);
	}

	@Transactional
	public ZonePrefixResponse addPrefix(Long zoneId, AddPrefixRequest req) {
		ShippingZone z = zoneRepository.fetchWithPrefixes(zoneId).orElseThrow(() -> notFound());
		addPrefixEntity(z, req.prefix());
		zoneRepository.save(z);
		ZonePrefix last = z.getPrefixes().stream().filter(pr -> pr.getPrefix().equalsIgnoreCase(req.prefix().trim()))
				.findFirst().orElseThrow();
		return new ZonePrefixResponse(last.getId(), last.getPrefix());
	}

	@Transactional
	public void deletePrefix(Long zoneId, Long prefixId) {
		ShippingZone z = zoneRepository.fetchWithPrefixes(zoneId).orElseThrow(() -> notFound());
		ZonePrefix p = prefixRepository.findById(prefixId).orElseThrow(() -> notFound());
		if (!p.getZone().getId().equals(z.getId())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Prefijo no pertenece a la zona");
		}
		z.getPrefixes().remove(p);
		prefixRepository.delete(p);
		zoneRepository.save(z);
	}

	@Transactional
	public void deleteZone(Long id) {
		ShippingZone z = zoneRepository.findById(id).orElseThrow(() -> notFound());
		if (matrixRepository.countCellsTouchingZone(id) > 0) {
			throw new ResponseStatusException(HttpStatus.CONFLICT,
					"Elimina o reasigna celdas de la matriz que usen esta zona");
		}
		zoneRepository.delete(z);
	}

	@Transactional(readOnly = true)
	public List<OficinaInZoneResponse> listOficinasInZone(Long zoneId) {
		ShippingZone z = zoneRepository.findById(zoneId).orElseThrow(() -> notFound());
		Set<String> prefs = z.getPrefixes().stream().map(ZonePrefix::getPrefix).collect(Collectors.toSet());
		if (z.isInternational()) {
			return List.of();
		}
		return oficinaRepository.findAll().stream()
				.filter(o -> matchesSpanishPrefixes(o.getPostalCode(), prefs))
				.map(o -> new OficinaInZoneResponse(o.getId(), o.getName(), o.getPostalCode(), o.getCity()))
				.toList();
	}

	@Transactional(readOnly = true)
	public List<RepartidorInZoneResponse> listRepartidoresInZone(Long zoneId) {
		ShippingZone z = zoneRepository.findById(zoneId).orElseThrow(() -> notFound());
		Set<String> prefs = z.getPrefixes().stream().map(ZonePrefix::getPrefix).collect(Collectors.toSet());
		return userRepository.findByRole(Role.REPARTIDOR).stream()
				.filter(u -> u.getPostalCode() != null && matchesSpanishPrefixes(u.getPostalCode(), prefs))
				.map(u -> new RepartidorInZoneResponse(u.getId(), u.getEmail(), u.getFullName(), u.getPostalCode(),
						u.isEnabled()))
				.toList();
	}

	private boolean matchesSpanishPrefixes(String postalCode, Set<String> twoDigitPrefixes) {
		String d = postalCode.replaceAll("\\D", "");
		if (d.length() < 2) {
			return false;
		}
		String two = d.substring(0, 2);
		return twoDigitPrefixes.contains(two);
	}

	@Transactional(readOnly = true)
	public List<PriceMatrixCellResponse> listMatrix() {
		return matrixRepository.findAll().stream()
				.sorted(Comparator
						.comparing((PriceMatrixCell c) -> c.getOriginZone().getDisplayOrder())
						.thenComparing(c -> c.getDestZone().getDisplayOrder()))
				.map(this::toCellResponse)
				.toList();
	}

	private PriceMatrixCellResponse toCellResponse(PriceMatrixCell c) {
		return new PriceMatrixCellResponse(c.getId(), c.getOriginZone().getId(), c.getOriginZone().getCode(),
				c.getDestZone().getId(), c.getDestZone().getCode(), c.getBasePrice(), c.getPricePerKgOver1(),
				c.getPricePerKgOver5(), c.getPricePerKgOver20(), c.getFuelSurcharge(), c.getRemoteAreaSurcharge(),
				c.getValidFrom(), c.getValidTo(), c.isActive());
	}

	@Transactional
	public PriceMatrixCellResponse patchCell(Long cellId, PriceMatrixCellPatchRequest req) {
		PriceMatrixCell c = matrixRepository.findById(cellId).orElseThrow(() -> notFound());
		if (req.basePrice() != null) {
			c.setBasePrice(req.basePrice());
		}
		if (req.pricePerKgOver1() != null) {
			c.setPricePerKgOver1(req.pricePerKgOver1());
		}
		if (req.pricePerKgOver5() != null) {
			c.setPricePerKgOver5(req.pricePerKgOver5());
		}
		if (req.pricePerKgOver20() != null) {
			c.setPricePerKgOver20(req.pricePerKgOver20());
		}
		if (req.fuelSurcharge() != null) {
			c.setFuelSurcharge(req.fuelSurcharge());
		}
		if (req.remoteAreaSurcharge() != null) {
			c.setRemoteAreaSurcharge(req.remoteAreaSurcharge());
		}
		if (req.validFrom() != null) {
			c.setValidFrom(req.validFrom());
		}
		if (req.validTo() != null) {
			c.setValidTo(req.validTo());
		}
		if (req.active() != null) {
			c.setActive(req.active());
		}
		return toCellResponse(matrixRepository.save(c));
	}

	@Transactional
	public void bulkMatrixUpdate(MatrixBulkUpdateRequest req) {
		for (MatrixBulkUpdateRequest.BulkCell b : req.cells()) {
			PriceMatrixCell c = matrixRepository
					.findByOriginZoneIdAndDestZoneId(b.originZoneId(), b.destZoneId())
					.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
							"Celda no existe: " + b.originZoneId() + "→" + b.destZoneId()));
			c.setBasePrice(b.basePrice());
			matrixRepository.save(c);
		}
	}

	@Transactional(readOnly = true)
	public byte[] exportMatrixCsv(DeliveryTypeCode deliveryView) {
		DeliveryTypeModifier mod = modifierRepository.findByCode(deliveryView).orElseThrow(() -> notFound());
		StringBuilder sb = new StringBuilder();
		sb.append("origin_code,dest_code,base_office_office,displayed_with_multiplier,total_flat_delivery\n");
		List<PriceMatrixCell> cells = matrixRepository.findAll();
		for (PriceMatrixCell c : cells) {
			BigDecimal sub = c.getBasePrice().add(nz(c.getFuelSurcharge())).add(nz(c.getRemoteAreaSurcharge()));
			BigDecimal shown = sub.multiply(mod.getMultiplier()).add(mod.getFlatSurcharge()).setScale(2,
					java.math.RoundingMode.HALF_UP);
			sb.append(c.getOriginZone().getCode()).append(',').append(c.getDestZone().getCode()).append(',')
					.append(c.getBasePrice()).append(',').append(shown).append(',').append(mod.getFlatSurcharge())
					.append('\n');
		}
		return sb.toString().getBytes(StandardCharsets.UTF_8);
	}

	private BigDecimal nz(BigDecimal v) {
		return v == null ? BigDecimal.ZERO : v;
	}

	@Transactional(readOnly = true)
	public List<DeliveryModifierResponse> listModifiers() {
		return modifierRepository.findAllByOrderByCodeAsc().stream().map(this::toModResponse).toList();
	}

	private DeliveryModifierResponse toModResponse(DeliveryTypeModifier m) {
		return new DeliveryModifierResponse(m.getId(), m.getCode().name(), m.getLabel(), m.getMultiplier(),
				m.getFlatSurcharge(), m.isActive());
	}

	@Transactional
	public DeliveryModifierResponse patchModifier(DeliveryTypeCode code, DeliveryModifierPatchRequest req) {
		DeliveryTypeModifier m = modifierRepository.findByCode(code).orElseThrow(() -> notFound());
		if (req.multiplier() != null) {
			m.setMultiplier(req.multiplier());
		}
		if (req.flatSurcharge() != null) {
			m.setFlatSurcharge(req.flatSurcharge());
		}
		if (req.active() != null) {
			m.setActive(req.active());
		}
		if (req.label() != null) {
			m.setLabel(req.label());
		}
		return toModResponse(modifierRepository.save(m));
	}

	private ResponseStatusException notFound() {
		return new ResponseStatusException(HttpStatus.NOT_FOUND, "Recurso no encontrado");
	}
}
