package com.ldh.backend.web;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ldh.backend.service.PricingService;
import com.ldh.backend.web.dto.PublicDeliveryTypeResponse;
import com.ldh.backend.web.dto.PricingQuoteRequest;
import com.ldh.backend.web.dto.PricingQuoteResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/public/pricing")
public class PublicPricingController {

	private final PricingService pricingService;

	public PublicPricingController(PricingService pricingService) {
		this.pricingService = pricingService;
	}

	/** Tipos de entrega activos para el asistente de envío (oficina/domicilio). */
	@GetMapping("/delivery-types")
	public List<PublicDeliveryTypeResponse> activeDeliveryTypes() {
		return pricingService.listActiveDeliveryTypes();
	}

	@PostMapping("/quote")
	public PricingQuoteResponse quote(@Valid @RequestBody PricingQuoteRequest request) {
		return pricingService.quote(request);
	}
}
