package com.ldh.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.ldh.backend.domain.Role;
import com.ldh.backend.domain.User;
import com.ldh.backend.repository.UserRepository;

@Component
@Order(0)
public class DataInitializer implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);
	public static final String DEFAULT_ADMIN_EMAIL = "admin@ldh.local";
	/** Contraseña inicial solo para desarrollo: cámbiala al primer acceso. */
	public static final String DEFAULT_ADMIN_PASSWORD = "Admin123!";

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;

	public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
	}

	@Override
	public void run(ApplicationArguments args) {
		if (userRepository.findByEmailIgnoreCase(DEFAULT_ADMIN_EMAIL).isPresent()) {
			return;
		}
		User admin = new User();
		admin.setEmail(DEFAULT_ADMIN_EMAIL);
		admin.setPasswordHash(passwordEncoder.encode(DEFAULT_ADMIN_PASSWORD));
		admin.setFullName("Administrador LDH");
		admin.setPostalCode("28001");
		admin.setRole(Role.ADMIN);
		admin.setEnabled(true);
		userRepository.save(admin);
		log.warn("Usuario admin creado: {} / {}", DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD);
	}
}
