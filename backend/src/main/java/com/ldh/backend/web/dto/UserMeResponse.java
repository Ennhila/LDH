package com.ldh.backend.web.dto;

import com.ldh.backend.domain.Role;

public record UserMeResponse(Long id, String email, String fullName, Role role, String postalCode, String phone,
		boolean shiftActive) {
}
