package com.ldh.backend.web;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.ldh.backend.security.UserPrincipal;
import com.ldh.backend.service.EnvioService;
import com.ldh.backend.service.RepartidorShiftService;
import com.ldh.backend.web.dto.EnvioResponse;
import com.ldh.backend.web.dto.EnvioStatusUpdateRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/repartidor")
public class RepartidorEnvioController {

	private final EnvioService envioService;
	private final RepartidorShiftService shiftService;

	public RepartidorEnvioController(EnvioService envioService, RepartidorShiftService shiftService) {
		this.envioService = envioService;
		this.shiftService = shiftService;
	}

	@GetMapping("/envios")
	public List<EnvioResponse> list() {
		return envioService.listForRepartidor();
	}

	@PatchMapping("/envios/{id}/status")
	public EnvioResponse updateStatus(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal principal,
			@Valid @RequestBody EnvioStatusUpdateRequest request) {
		return envioService.updateStatusByRepartidor(id, principal, request);
	}

	@PostMapping("/shift/start")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void startShift(@AuthenticationPrincipal UserPrincipal principal) {
		shiftService.startShift(principal);
	}

	@PostMapping("/shift/end")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void endShift(@AuthenticationPrincipal UserPrincipal principal) {
		shiftService.endShift(principal);
	}
}
