package com.ldh.backend.web.dto.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ChatTurnDto(
		@NotBlank @Pattern(regexp = "user|assistant", message = "role must be user or assistant") String role,
		@NotBlank @Size(max = 4000) String content) {
}
