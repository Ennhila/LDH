package com.ldh.backend.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.ldh.backend.domain.Role;
import com.ldh.backend.domain.User;
import com.ldh.backend.repository.UserRepository;
import com.ldh.backend.security.UserPrincipal;

@Service
public class RepartidorShiftService {

	private final UserRepository userRepository;

	public RepartidorShiftService(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	@Transactional
	public void startShift(UserPrincipal principal) {
		User u = loadRepartidor(principal);
		u.setShiftActive(true);
		userRepository.save(u);
	}

	@Transactional
	public void endShift(UserPrincipal principal) {
		User u = loadRepartidor(principal);
		u.setShiftActive(false);
		userRepository.save(u);
	}

	private User loadRepartidor(UserPrincipal principal) {
		User u = userRepository.findById(principal.id()).orElseThrow(() -> new ResponseStatusException(
				HttpStatus.UNAUTHORIZED, "Usuario no válido"));
		if (u.getRole() != Role.REPARTIDOR) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo repartidores");
		}
		return u;
	}
}
