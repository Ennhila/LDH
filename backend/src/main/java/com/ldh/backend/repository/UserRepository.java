package com.ldh.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ldh.backend.domain.Role;
import com.ldh.backend.domain.User;

public interface UserRepository extends JpaRepository<User, Long> {

	Optional<User> findByEmailIgnoreCase(String email);

	boolean existsByEmailIgnoreCase(String email);

	long countByRole(Role role);

	long countByRoleAndShiftActiveIsTrue(Role role);

	List<User> findByRole(Role role);
}
