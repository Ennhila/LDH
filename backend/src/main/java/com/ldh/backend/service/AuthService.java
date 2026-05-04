package com.ldh.backend.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.ldh.backend.domain.Role;
import com.ldh.backend.domain.User;
import com.ldh.backend.repository.UserRepository;
import com.ldh.backend.security.JwtService;
import com.ldh.backend.security.UserPrincipal;
import com.ldh.backend.web.dto.AuthResponse;
import com.ldh.backend.web.dto.LoginRequest;
import com.ldh.backend.web.dto.RegisterRequest;

@Service
public class AuthService {

	private final UserRepository userRepository;
	private final AuthenticationManager authenticationManager;
	private final JwtService jwtService;
	private final UserAccountService userAccountService;

	public AuthService(UserRepository userRepository, AuthenticationManager authenticationManager, JwtService jwtService,
			UserAccountService userAccountService) {
		this.userRepository = userRepository;
		this.authenticationManager = authenticationManager;
		this.jwtService = jwtService;
		this.userAccountService = userAccountService;
	}

	@Transactional
	public AuthResponse register(RegisterRequest request) {
		if (userRepository.existsByEmailIgnoreCase(request.email())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "El correo ya está registrado");
		}
		User user = userAccountService.createClient(request);
		String token = jwtService.createToken(user.getEmail(), user.getRole());
		return new AuthResponse(token, user.getEmail(), user.getRole(), user.getFullName());
	}

	@Transactional
	public AuthResponse login(LoginRequest request) {
		try {
			Authentication auth = authenticationManager.authenticate(
					new UsernamePasswordAuthenticationToken(request.email().trim(), request.password()));
			UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
			User user = principal.user();
			user.setLastLoginAt(java.time.Instant.now());
			userRepository.save(user);
			String token = jwtService.createToken(user.getEmail(), user.getRole());
			return new AuthResponse(token, user.getEmail(), user.getRole(), user.getFullName());
		}
		catch (BadCredentialsException e) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales incorrectas");
		}
	}
}
