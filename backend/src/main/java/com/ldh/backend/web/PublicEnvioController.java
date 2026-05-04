package com.ldh.backend.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ldh.backend.service.EnvioService;
import com.ldh.backend.web.dto.EnvioResponse;

@RestController
@RequestMapping("/api/public/envios")
public class PublicEnvioController {

	private final EnvioService envioService;

	public PublicEnvioController(EnvioService envioService) {
		this.envioService = envioService;
	}

	@GetMapping("/track/{trackingNumber}")
	public EnvioResponse track(@PathVariable String trackingNumber) {
		return envioService.trackPublic(trackingNumber);
	}
}
