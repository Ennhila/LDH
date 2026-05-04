package com.ldh.backend.web.dto;

import com.ldh.backend.domain.Role;

public record AuthResponse(String token, String email, Role role, String fullName) {
}
