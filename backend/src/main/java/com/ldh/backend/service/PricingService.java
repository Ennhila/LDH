package com.ldh.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.ldh.backend.domain.DeliveryTypeCode;
import com.ldh.backend.domain.DeliveryTypeModifier;
import com.ldh.backend.domain.PriceMatrixCell;
import com.ldh.backend.domain.ShippingZone;
import com.ldh.backend.domain.ZonePrefix;
import com.ldh.backend.repository.DeliveryTypeModifierRepository;
import com.ldh.backend.repository.PriceMatrixCellRepository;
import com.ldh.backend.repository.ShippingZoneRepository;
import com.ldh.backend.repository.ZonePrefixRepository;
import com.ldh.backend.web.dto.PublicDeliveryTypeResponse;
import com.ldh.backend.web.dto.PricingQuoteRequest;
import com.ldh.backend.web.dto.PricingQuoteResponse;
// (zones → matrix → weight → delivery type)	

@Service
public class PricingService {

	private final ZonePrefixRepository zonePrefixRepository;
	private final ShippingZoneRepository shippingZoneRepository;
	private final PriceMatrixCellRepository matrixRepository;
	private final DeliveryTypeModifierRepository modifierRepository;

	public PricingService(ZonePrefixRepository zonePrefixRepository, ShippingZoneRepository shippingZoneRepository,
			PriceMatrixCellRepository matrixRepository, DeliveryTypeModifierRepository modifierRepository) {
		this.zonePrefixRepository = zonePrefixRepository;
		this.shippingZoneRepository = shippingZoneRepository;
		this.matrixRepository = matrixRepository;
		this.modifierRepository = modifierRepository;
	}
	
	@Transactional(readOnly = true)
	public List<PublicDeliveryTypeResponse> listActiveDeliveryTypes() {
		return modifierRepository.findAllByActiveIsTrueOrderByCodeAsc().stream()
				.map(m -> new PublicDeliveryTypeResponse(m.getCode().name(), m.getLabel()))
				.toList();
	}

	@Transactional(readOnly = true)
	public PricingQuoteResponse quote(PricingQuoteRequest req) {
		ShippingZone origin = resolveZone(req.originCountry(), req.originPostalCode());
		ShippingZone dest = resolveZone(req.destinationCountry(), req.destinationPostalCode());
		DeliveryTypeCode dtype = DeliveryTypeCode.fromPickupDelivery(req.pickupOffice(), req.deliveryOffice());
		PriceMatrixCell cell = matrixRepository
				.findByOriginZoneIdAndDestZoneId(origin.getId(), dest.getId())
				.filter(this::cellValidNow)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sin tarifa para esta ruta"));
		DeliveryTypeModifier mod = modifierRepository
				.findByCode(dtype)
				.filter(DeliveryTypeModifier::isActive)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Modificador no configurado"));
		BigDecimal w = req.weightKg() != null ? req.weightKg() : BigDecimal.ONE;
		BigDecimal weightPart = weightComponent(w, cell);
		BigDecimal subtotal = cell.getBasePrice()
				.add(weightPart)
				.add(nz(cell.getFuelSurcharge()))
				.add(nz(cell.getRemoteAreaSurcharge()));
		BigDecimal afterMult = subtotal.multiply(mod.getMultiplier()).setScale(2, RoundingMode.HALF_UP);
		BigDecimal total = afterMult.add(mod.getFlatSurcharge()).setScale(2, RoundingMode.HALF_UP);
		return new PricingQuoteResponse(
				origin.getId(),
				origin.getCode(),
				origin.getName(),
				dest.getId(),
				dest.getCode(),
				dest.getName(),
				dtype.name(),
				cell.getBasePrice(),
				weightPart,
				nz(cell.getFuelSurcharge()),
				nz(cell.getRemoteAreaSurcharge()),
				mod.getMultiplier(),
				mod.getFlatSurcharge(),
				total);
	}

	private boolean cellValidNow(PriceMatrixCell c) {
		if (!c.isActive()) {
			return false;
		}
		LocalDate today = LocalDate.now();
		if (c.getValidFrom() != null && today.isBefore(c.getValidFrom())) {
			return false;
		}
		return c.getValidTo() == null || !today.isAfter(c.getValidTo());
	}

	public ShippingZone resolveZone(String countryIso, String postalOrEmpty) {
		String cc = countryIso == null ? "ES" : countryIso.trim().toUpperCase();
		if ("ES".equals(cc)) {
			String digits = (postalOrEmpty == null ? "" : postalOrEmpty).replaceAll("\\D", "");
			if (digits.length() < 2) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Código postal de origen/destino inválido");
			}
			String two = digits.substring(0, 2);
			Optional<ShippingZone> z = zonePrefixRepository.findByPrefixIgnoreCase(two).map(p -> p.getZone());
			return z.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "CP español fuera de zona"));
		}
		String iso = cc.length() == 2 ? cc : cc.substring(0, Math.min(2, cc.length()));
		return zonePrefixRepository
				.findByPrefixIgnoreCase(iso)
				.map(ZonePrefix::getZone)
				.filter(ShippingZone::isInternational)
				.orElseGet(() -> shippingZoneRepository
						.findByCode("ZONE_INTL_WEST_EU")
						.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "País no cubierto")));
	}

	private BigDecimal nz(BigDecimal v) {
		return v == null ? BigDecimal.ZERO : v;
	}

	private BigDecimal weightComponent(BigDecimal weightKg, PriceMatrixCell cell) {
		if (weightKg == null || weightKg.compareTo(BigDecimal.ONE) <= 0) {
			return BigDecimal.ZERO;
		}
		BigDecimal r1 = nz(cell.getPricePerKgOver1());
		BigDecimal r5 = nz(cell.getPricePerKgOver5());
		BigDecimal r20 = nz(cell.getPricePerKgOver20());
		BigDecimal extra = BigDecimal.ZERO;
		BigDecimal w = weightKg;
		if (w.compareTo(BigDecimal.ONE) > 0) {
			BigDecimal seg = w.min(new BigDecimal("5")).subtract(BigDecimal.ONE).max(BigDecimal.ZERO);
			extra = extra.add(seg.multiply(r1));
		}
		if (w.compareTo(new BigDecimal("5")) > 0) {
			BigDecimal seg = w.min(new BigDecimal("20")).subtract(new BigDecimal("5")).max(BigDecimal.ZERO);
			extra = extra.add(seg.multiply(r5));
		}
		if (w.compareTo(new BigDecimal("20")) > 0) {
			extra = extra.add(w.subtract(new BigDecimal("20")).multiply(r20));
		}
		return extra.setScale(2, RoundingMode.HALF_UP);
	}
}
