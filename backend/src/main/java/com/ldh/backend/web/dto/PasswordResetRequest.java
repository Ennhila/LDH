package com.ldh.backend.web.dto;

import com.ldh.backend.validation.StrongPassword;

import jakarta.validation.constraints.NotBlank;

public record PasswordResetRequest(@NotBlank @StrongPassword String password) {
}
