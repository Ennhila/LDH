package com.ldh.backend.web;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ldh.backend.service.OficinaService;
import com.ldh.backend.web.dto.OficinaResponse;

@RestController
@RequestMapping("/api/public/oficinas")
public class PublicOficinaController {

	private final OficinaService oficinaService;

	public PublicOficinaController(OficinaService oficinaService) {
		this.oficinaService = oficinaService;
	}

	@GetMapping
	public List<OficinaResponse> list() {
		return oficinaService.list();
	}
}
