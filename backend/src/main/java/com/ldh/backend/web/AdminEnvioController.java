package com.ldh.backend.web;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ldh.backend.security.UserPrincipal;
import com.ldh.backend.service.EnvioService;
import com.ldh.backend.web.dto.ClientCheckoutSnapshotResponse;
import com.ldh.backend.web.dto.EnvioResponse;
import com.ldh.backend.web.dto.EnvioStatusAuditResponse;
import com.ldh.backend.web.dto.EnvioStatusUpdateRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/envios")
public class AdminEnvioController {

	private final EnvioService envioService;

	public AdminEnvioController(EnvioService envioService) {
		this.envioService = envioService;
	}

	@GetMapping
	public List<EnvioResponse> list() {
		return envioService.listAllForAdmin();
	}

	@GetMapping("/{id}/audit")
	public List<EnvioStatusAuditResponse> audit(@PathVariable Long id) {
		return envioService.listAuditForEnvio(id);
	}

	@GetMapping("/{id}/checkout-snapshot")
	public ClientCheckoutSnapshotResponse checkoutSnapshot(@PathVariable Long id) {
		return envioService.getCheckoutSnapshotForAdmin(id);
	}

	@PatchMapping("/{id}/status")
	public EnvioResponse patchStatus(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal principal,
			@Valid @RequestBody EnvioStatusUpdateRequest body) {
		return envioService.updateStatusByAdmin(id, principal, body);
	}
}
