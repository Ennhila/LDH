package com.ldh.backend.web;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.ldh.backend.service.RepartidorAdminService;
import com.ldh.backend.web.dto.CreateRepartidorRequest;
import com.ldh.backend.web.dto.PasswordResetRequest;
import com.ldh.backend.web.dto.RepartidorResponse;
import com.ldh.backend.web.dto.UpdateRepartidorRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/repartidores")
public class AdminRepartidorController {

	private final RepartidorAdminService repartidorAdminService;

	public AdminRepartidorController(RepartidorAdminService repartidorAdminService) {
		this.repartidorAdminService = repartidorAdminService;
	}

	@GetMapping
	public List<RepartidorResponse> list() {
		return repartidorAdminService.list();
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public RepartidorResponse create(@Valid @RequestBody CreateRepartidorRequest request) {
		return repartidorAdminService.create(request);
	}

	@PutMapping("/{id}")
	public RepartidorResponse update(@PathVariable Long id, @Valid @RequestBody UpdateRepartidorRequest request) {
		return repartidorAdminService.update(id, request);
	}

	@PostMapping("/{id}/password")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void resetPassword(@PathVariable Long id, @Valid @RequestBody PasswordResetRequest request) {
		repartidorAdminService.resetPassword(id, request.password());
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void disable(@PathVariable Long id) {
		repartidorAdminService.disable(id);
	}
}
