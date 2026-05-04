package com.ldh.backend.service;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;

import com.ldh.backend.web.dto.chat.ChatStreamRequest;
import com.ldh.backend.web.dto.chat.ChatTurnDto;

import jakarta.servlet.http.HttpServletResponse;

@Service
public class GroqChatStreamService {

	private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

	private static final String SYSTEM_PROMPT = """
			You are a helpful assistant for LDH, a logistics and smart-locker delivery company operating in Spain and Europe, offering parcel shipping, 24/7 locker pickup, and national and international shipments. Your role is to assist visitors with questions about shipping options, how pricing and quotes work, delivery types, lockers, offices, shipment tracking, and general support. Be friendly, concise, and professional.

			The chat widget already showed this greeting (do not repeat it unless the user greets you again): "Hi! I'm Ilyass, your AI assistant. How can I help you today?"

			Rules:
			- If you don't know something, say so honestly and suggest they contact the team at contact@ldh.es.
			- Do not invent specific prices, rates, or policies. For exact quotes, direct users to the shipping calculator / checkout flow on the website.
			- Keep answers short unless the user asks for more detail.
			- Always respond in the same language the user writes in (e.g. Spanish if they write in Spanish, English if they write in English).

			Context data from the LDH site (use when relevant; never contradict it; do not fabricate beyond it):
			""";

	private final HttpClient httpClient;

	@Value("${groq.api.key:}")
	private String groqApiKey;

	@Value("${groq.model:llama-3.3-70b-versatile}")
	private String groqModel;

	public GroqChatStreamService() {
		this.httpClient = HttpClient.newBuilder()
				.connectTimeout(Duration.ofSeconds(30))
				.build();
	}

	public void stream(ChatStreamRequest request, HttpServletResponse response) throws IOException {
		if (groqApiKey == null || groqApiKey.isBlank()) {
			response.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
			response.setContentType(MediaType.APPLICATION_JSON_VALUE);
			response.getWriter().write("{\"error\":\"Chat is not configured (missing GROQ_API_KEY).\"}");
			return;
		}

		List<ChatTurnDto> turns = new ArrayList<>(request.messages());
		if (turns.size() > 20) {
			turns = turns.subList(turns.size() - 20, turns.size());
		}

		String bodyJson = buildGroqBody(turns, request.context());

		HttpRequest groqRequest = HttpRequest.newBuilder()
				.uri(URI.create(GROQ_URL))
				.timeout(Duration.ofMinutes(2))
				.header("Authorization", "Bearer " + groqApiKey)
				.header("Content-Type", "application/json")
				.POST(HttpRequest.BodyPublishers.ofString(bodyJson, StandardCharsets.UTF_8))
				.build();

		final HttpResponse<InputStream> groqResponse;
		try {
			groqResponse = httpClient.send(groqRequest, HttpResponse.BodyHandlers.ofInputStream());
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
			response.setStatus(HttpServletResponse.SC_GATEWAY_TIMEOUT);
			response.setContentType(MediaType.APPLICATION_JSON_VALUE);
			response.getWriter().write("{\"error\":\"Chat request interrupted.\"}");
			return;
		} catch (Exception e) {
			response.setStatus(HttpServletResponse.SC_BAD_GATEWAY);
			response.setContentType(MediaType.APPLICATION_JSON_VALUE);
			response.getWriter().write("{\"error\":\"Could not reach AI service.\"}");
			return;
		}

		try (InputStream in = groqResponse.body()) {
			int code = groqResponse.statusCode();
			if (code != 200) {
				byte[] errBytes = in.readAllBytes();
				String err = errBytes.length == 0 ? "{\"message\":\"Groq error\"}" : new String(errBytes, StandardCharsets.UTF_8);
				if (code == 429) {
					response.setStatus(429);
				} else {
					response.setStatus(code >= 400 && code < 600 ? code : HttpServletResponse.SC_BAD_GATEWAY);
				}
				response.setContentType(MediaType.APPLICATION_JSON_VALUE);
				response.getWriter().write(err);
				return;
			}

			response.setStatus(200);
			response.setContentType("text/event-stream; charset=UTF-8");
			response.setCharacterEncoding(StandardCharsets.UTF_8.name());
			response.setHeader("Cache-Control", "no-cache, no-transform");
			response.setHeader("Connection", "keep-alive");
			response.setHeader("X-Accel-Buffering", "no");

			OutputStream out = response.getOutputStream();
			in.transferTo(out);
			out.flush();
		}
	}

	private String buildGroqBody(List<ChatTurnDto> turns, String context) {
		String systemContent = SYSTEM_PROMPT + (context == null || context.isBlank() ? "(none)" : context.trim());
		StringBuilder sb = new StringBuilder(512 + systemContent.length());
		sb.append("{\"model\":\"").append(jsonString(groqModel)).append("\",\"stream\":true,\"temperature\":0.6,\"messages\":[");
		sb.append("{\"role\":\"system\",\"content\":").append(jsonQuote(systemContent)).append('}');
		for (ChatTurnDto t : turns) {
			sb.append(",{\"role\":\"").append(t.role()).append("\",\"content\":").append(jsonQuote(t.content())).append('}');
		}
		sb.append("]}");
		return sb.toString();
	}

	private static String jsonString(String raw) {
		return raw.replace("\\", "\\\\").replace("\"", "\\\"");
	}

	private static String jsonQuote(String s) {
		if (s == null) {
			return "\"\"";
		}
		StringBuilder sb = new StringBuilder(s.length() + 16);
		sb.append('"');
		for (int i = 0; i < s.length(); i++) {
			char c = s.charAt(i);
			switch (c) {
				case '\\' -> sb.append("\\\\");
				case '"' -> sb.append("\\\"");
				case '\n' -> sb.append("\\n");
				case '\r' -> sb.append("\\r");
				case '\t' -> sb.append("\\t");
				default -> {
					if (c < 0x20) {
						sb.append(String.format("\\u%04x", (int) c));
					} else {
						sb.append(c);
					}
				}
			}
		}
		sb.append('"');
		return sb.toString();
	}
}
