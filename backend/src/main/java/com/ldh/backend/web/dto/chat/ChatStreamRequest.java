package com.ldh.backend.web.dto.chat;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ChatStreamRequest(
		@NotNull @Size(min = 1, max = 20) @Valid List<ChatTurnDto> messages,
		@Size(max = 12000) String context) {
}
