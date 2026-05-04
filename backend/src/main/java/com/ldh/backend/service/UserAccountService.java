package com.ldh.backend.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ldh.backend.domain.Role;
import com.ldh.backend.domain.User;
import com.ldh.backend.repository.UserRepository;
import com.ldh.backend.web.dto.CreateRepartidorRequest;
import com.ldh.backend.web.dto.RegisterRequest;

@Service
public class UserAccountService {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;

	public UserAccountService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
	}

	@Transactional
	public User createClient(RegisterRequest request) {
		User u = new User();
		u.setEmail(request.email().trim().toLowerCase());
		u.setPasswordHash(passwordEncoder.encode(request.password()));
		u.setFullName(request.fullName().trim());
		u.setPostalCode(request.postalCode().trim());
		u.setRole(Role.CLIENTE);
		u.setEnabled(true);
		return userRepository.save(u);
	}

	@Transactional
	public User createRepartidor(CreateRepartidorRequest request) {
		User u = new User();
		u.setEmail(request.email().trim().toLowerCase());
		u.setPasswordHash(passwordEncoder.encode(request.password()));
		u.setFullName(request.fullName().trim());
		u.setPostalCode(request.postalCode().trim());
		u.setPhone(request.phone() != null ? request.phone().trim() : null);
		u.setRole(Role.REPARTIDOR);
		u.setEnabled(true);
		return userRepository.save(u);
	}
}
