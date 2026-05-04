package com.ldh.backend.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.ldh.backend.domain.Role;
import com.ldh.backend.domain.User;
import com.ldh.backend.repository.UserRepository;
import com.ldh.backend.web.dto.CreateRepartidorRequest;
import com.ldh.backend.web.dto.RepartidorResponse;
import com.ldh.backend.web.dto.UpdateRepartidorRequest;

@Service
public class RepartidorAdminService {

	private final UserRepository userRepository;
	private final UserAccountService userAccountService;
	private final PasswordEncoder passwordEncoder;

	public RepartidorAdminService(UserRepository userRepository, UserAccountService userAccountService,
			PasswordEncoder passwordEncoder) {
		this.userRepository = userRepository;
		this.userAccountService = userAccountService;
		this.passwordEncoder = passwordEncoder;
	}

	@Transactional(readOnly = true)
	public List<RepartidorResponse> list() {
		return userRepository.findAll().stream()
				.filter(u -> u.getRole() == Role.REPARTIDOR)
				.map(this::toResponse)
				.toList();
	}

	@Transactional
	public RepartidorResponse create(CreateRepartidorRequest request) {
		if (userRepository.existsByEmailIgnoreCase(request.email())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "El correo ya existe");
		}
		return toResponse(userAccountService.createRepartidor(request));
	}

	@Transactional
	public RepartidorResponse update(Long id, UpdateRepartidorRequest request) {
		User u = userRepository.findById(id).orElseThrow(() -> notFound(id));
		if (u.getRole() != Role.REPARTIDOR) {
			throw notFound(id);
		}
		String newEmail = request.email().trim().toLowerCase();
		if (!u.getEmail().equalsIgnoreCase(newEmail) && userRepository.existsByEmailIgnoreCase(newEmail)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "El correo ya existe");
		}
		u.setEmail(newEmail);
		u.setFullName(request.fullName().trim());
		u.setPostalCode(request.postalCode().trim());
		u.setPhone(request.phone() != null ? request.phone().trim() : null);
		return toResponse(userRepository.save(u));
	}

	@Transactional
	public void resetPassword(Long id, String newPassword) {
		User u = userRepository.findById(id).orElseThrow(() -> notFound(id));
		if (u.getRole() != Role.REPARTIDOR) {
			throw notFound(id);
		}
		u.setPasswordHash(passwordEncoder.encode(newPassword));
		userRepository.save(u);
	}

	@Transactional
	public void disable(Long id) {
		User u = userRepository.findById(id).orElseThrow(() -> notFound(id));
		if (u.getRole() != Role.REPARTIDOR) {
			throw notFound(id);
		}
		u.setEnabled(false);
		u.setShiftActive(false);
		userRepository.save(u);
	}

	private RepartidorResponse toResponse(User u) {
		return new RepartidorResponse(u.getId(), u.getEmail(), u.getFullName(), u.getPostalCode(), u.getPhone(),
				u.isEnabled(), u.isShiftActive());
	}

	private static ResponseStatusException notFound(Long id) {
		return new ResponseStatusException(HttpStatus.NOT_FOUND, "Repartidor no encontrado: " + id);
	}
}
