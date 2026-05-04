package com.ldh.backend.web;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.ldh.backend.security.UserPrincipal;
import com.ldh.backend.service.AuthService;
import com.ldh.backend.web.dto.AuthResponse;
import com.ldh.backend.web.dto.LoginRequest;
import com.ldh.backend.web.dto.RegisterRequest;
import com.ldh.backend.web.dto.UserMeResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final AuthService authService;

	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	@PostMapping("/register")
	@ResponseStatus(HttpStatus.CREATED)
	public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
		return authService.register(request);
	}

	@PostMapping("/login")
	public AuthResponse login(@Valid @RequestBody LoginRequest request) {
		return authService.login(request);
	}

	@GetMapping("/me")
	public UserMeResponse me(@AuthenticationPrincipal UserPrincipal principal) {
		if (principal == null) {
			throw new org.springframework.web.server.ResponseStatusException(HttpStatus.UNAUTHORIZED);
		}
		var u = principal.user();
		return new UserMeResponse(u.getId(), u.getEmail(), u.getFullName(), u.getRole(), u.getPostalCode(), u.getPhone(),
				u.isShiftActive());
	}
}
