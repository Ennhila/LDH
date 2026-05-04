package com.ldh.backend.web;

import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ldh.backend.domain.DeliveryTypeCode;
import com.ldh.backend.service.PricingAdminService;
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

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/prices")
public class AdminPricingController {

	private final PricingAdminService pricingAdminService;

	public AdminPricingController(PricingAdminService pricingAdminService) {
		this.pricingAdminService = pricingAdminService;
	}

	@GetMapping("/zones")
	public List<ShippingZoneResponse> listZones() {
		return pricingAdminService.listZones();
	}

	@PostMapping("/zones")
	public ShippingZoneResponse createZone(@Valid @RequestBody ShippingZoneRequest request) {
		return pricingAdminService.createZone(request);
	}

	@PutMapping("/zones/{id}")
	public ShippingZoneResponse updateZone(@PathVariable Long id, @Valid @RequestBody ShippingZoneRequest request) {
		return pricingAdminService.updateZone(id, request);
	}

	@DeleteMapping("/zones/{id}")
	public ResponseEntity<Void> deleteZone(@PathVariable Long id) {
		pricingAdminService.deleteZone(id);
		return ResponseEntity.noContent().build();
	}

	@GetMapping("/zones/{id}/oficinas")
	public List<OficinaInZoneResponse> zoneOficinas(@PathVariable Long id) {
		return pricingAdminService.listOficinasInZone(id);
	}

	@GetMapping("/zones/{id}/repartidores")
	public List<RepartidorInZoneResponse> zoneRepartidores(@PathVariable Long id) {
		return pricingAdminService.listRepartidoresInZone(id);
	}

	@PostMapping("/zones/{id}/prefixes")
	public ZonePrefixResponse addPrefix(@PathVariable Long id, @Valid @RequestBody AddPrefixRequest request) {
		return pricingAdminService.addPrefix(id, request);
	}

	@DeleteMapping("/zones/{id}/prefixes/{prefixId}")
	public ResponseEntity<Void> deletePrefix(@PathVariable Long id, @PathVariable Long prefixId) {
		pricingAdminService.deletePrefix(id, prefixId);
		return ResponseEntity.noContent().build();
	}

	@GetMapping("/matrix")
	public List<PriceMatrixCellResponse> matrix() {
		return pricingAdminService.listMatrix();
	}

	@PatchMapping("/matrix/cells/{cellId}")
	public PriceMatrixCellResponse patchCell(@PathVariable Long cellId,
			@RequestBody PriceMatrixCellPatchRequest request) {
		return pricingAdminService.patchCell(cellId, request);
	}

	@PostMapping("/matrix/bulk")
	public ResponseEntity<Void> bulk(@Valid @RequestBody MatrixBulkUpdateRequest request) {
		pricingAdminService.bulkMatrixUpdate(request);
		return ResponseEntity.noContent().build();
	}

	@GetMapping(value = "/matrix/export.csv", produces = "text/csv")
	public ResponseEntity<byte[]> exportMatrix(@RequestParam(defaultValue = "OFFICE_OFFICE") DeliveryTypeCode deliveryType) {
		byte[] csv = pricingAdminService.exportMatrixCsv(deliveryType);
		return ResponseEntity.ok()
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"ldh-price-matrix.csv\"")
				.contentType(MediaType.parseMediaType("text/csv"))
				.body(csv);
	}

	@GetMapping("/delivery-modifiers")
	public List<DeliveryModifierResponse> modifiers() {
		return pricingAdminService.listModifiers();
	}

	@PatchMapping("/delivery-modifiers/{code}")
	public DeliveryModifierResponse patchModifier(@PathVariable DeliveryTypeCode code,
			@RequestBody DeliveryModifierPatchRequest request) {
		return pricingAdminService.patchModifier(code, request);
	}
}
