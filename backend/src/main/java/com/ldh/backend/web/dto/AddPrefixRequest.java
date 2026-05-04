package com.ldh.backend.web.dto;

import jakarta.validation.constraints.NotBlank;

public record AddPrefixRequest(@NotBlank String prefix) {
}
