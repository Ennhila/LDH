package com.ldh.backend.web;

import java.io.IOException;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ldh.backend.service.GroqChatStreamService;
import com.ldh.backend.web.dto.chat.ChatStreamRequest;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/public/chat")
public class PublicChatController {

	private final GroqChatStreamService groqChatStreamService;

	public PublicChatController(GroqChatStreamService groqChatStreamService) {
		this.groqChatStreamService = groqChatStreamService;
	}

	@PostMapping("/stream")
	public void stream(@Valid @RequestBody ChatStreamRequest request, HttpServletResponse response) throws IOException {
		groqChatStreamService.stream(request, response);
	}
}
