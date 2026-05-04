package com.ldh.backend.web;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.ldh.backend.security.UserPrincipal;
import com.ldh.backend.service.EnvioService;
import com.ldh.backend.web.dto.ClientCheckoutSnapshotResponse;
import com.ldh.backend.web.dto.EnvioCreateRequest;
import com.ldh.backend.web.dto.EnvioResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/client/envios")
public class ClientEnvioController {

	private final EnvioService envioService;

	public ClientEnvioController(EnvioService envioService) {
		this.envioService = envioService;
	}

	@GetMapping
	public List<EnvioResponse> mine(@AuthenticationPrincipal UserPrincipal principal) {
		return envioService.listForClient(principal);
	}

	@GetMapping("/by-tracking/{trackingNumber}/checkout-snapshot")
	public ClientCheckoutSnapshotResponse checkoutSnapshot(@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable String trackingNumber) {
		return envioService.getCheckoutSnapshotForClient(principal, trackingNumber);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public EnvioResponse create(@AuthenticationPrincipal UserPrincipal principal,
			@Valid @RequestBody EnvioCreateRequest request) {
		return envioService.createForClient(principal, request);
	}
}
