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

import com.ldh.backend.service.OficinaService;
import com.ldh.backend.web.dto.OficinaRequest;
import com.ldh.backend.web.dto.OficinaResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/oficinas")
public class AdminOficinaController {

	private final OficinaService oficinaService;

	public AdminOficinaController(OficinaService oficinaService) {
		this.oficinaService = oficinaService;
	}

	@GetMapping
	public List<OficinaResponse> list() {
		return oficinaService.list();
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public OficinaResponse create(@Valid @RequestBody OficinaRequest request) {
		return oficinaService.create(request);
	}

	@PutMapping("/{id}")
	public OficinaResponse update(@PathVariable Long id, @Valid @RequestBody OficinaRequest request) {
		return oficinaService.update(id, request);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@PathVariable Long id) {
		oficinaService.delete(id);
	}
}
