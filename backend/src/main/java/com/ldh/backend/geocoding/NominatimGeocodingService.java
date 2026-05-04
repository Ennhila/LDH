package com.ldh.backend.geocoding;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Geocodificación vía Nominatim (OpenStreetMap). Uso moderado; ver
 * https://operations.osmfoundation.org/policies/nominatim/
 */
@Service
public class NominatimGeocodingService {

	private static final Logger log = LoggerFactory.getLogger(NominatimGeocodingService.class);

	private final boolean enabled;
	private final String userAgent;

	public NominatimGeocodingService(
			@Value("${ldh.geocoding.enabled:true}") boolean enabled,
			@Value("${ldh.geocoding.user-agent:LDH-Backend/1.0 (internal admin; contact: admin@ldh.local)}") String userAgent) {
		this.enabled = enabled;
		this.userAgent = userAgent;
	}

	public Optional<GeoPoint> geocode(String addressLine, String postalCode, String city) {
		if (!enabled) {
			return Optional.empty();
		}
		String query = String.format("%s, %s %s, Spain", addressLine.trim(), postalCode.trim(), city.trim());
		String encoded = URLEncoder.encode(query, StandardCharsets.UTF_8);
		String url = "https://nominatim.openstreetmap.org/search?q=" + encoded + "&format=json&limit=1";

		HttpRequest request = HttpRequest.newBuilder()
				.uri(URI.create(url))
				.header("User-Agent", userAgent)
				.header("Accept-Language", "es,en")
				.timeout(Duration.ofSeconds(15))
				.GET()
				.build();

		try {
			HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
			HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
			if (response.statusCode() != 200) {
				log.warn("Nominatim HTTP {} for query: {}", response.statusCode(), query);
				return Optional.empty();
			}
			String body = response.body();
			if (body == null || body.isBlank() || !body.trim().startsWith("[")) {
				log.info("Nominatim sin resultados para: {}", query);
				return Optional.empty();
			}
			Optional<Double> latOpt = parseJsonNumberAfterKey(body, "lat");
			Optional<Double> lonOpt = parseJsonNumberAfterKey(body, "lon");
			if (latOpt.isEmpty() || lonOpt.isEmpty()) {
				String snippet = body.length() > 400 ? body.substring(0, 400) + "…" : body;
				log.warn("Nominatim: respuesta sin lat/lon parseables. Consulta: {} — fragmento: {}", query, snippet);
				return Optional.empty();
			}
			return Optional.of(new GeoPoint(latOpt.get(), lonOpt.get()));
		}
		catch (InterruptedException e) {
			Thread.currentThread().interrupt();
			log.warn("Geocodificación interrumpida para '{}'", query);
			return Optional.empty();
		}
		catch (IOException e) {
			log.warn("Geocodificación fallida para '{}': {}", query, e.getMessage());
			return Optional.empty();
		}
	}

	/**
	 * Primer valor de {@code "lat"} / {@code "lon"} en el JSON (Nominatim usa string o número).
	 */
	static Optional<Double> parseJsonNumberAfterKey(String json, String key) {
		String needle = "\"" + key + "\"";
		int idx = json.indexOf(needle);
		if (idx < 0) {
			return Optional.empty();
		}
		int colon = json.indexOf(':', idx + needle.length());
		if (colon < 0) {
			return Optional.empty();
		}
		int i = colon + 1;
		while (i < json.length() && Character.isWhitespace(json.charAt(i))) {
			i++;
		}
		if (i >= json.length()) {
			return Optional.empty();
		}
		try {
			if (json.charAt(i) == '"') {
				int end = json.indexOf('"', i + 1);
				if (end < 0) {
					return Optional.empty();
				}
				return Optional.of(Double.parseDouble(json.substring(i + 1, end)));
			}
			int start = i;
			while (i < json.length()) {
				char c = json.charAt(i);
				if (c == ',' || c == '}' || c == ']' || Character.isWhitespace(c)) {
					break;
				}
				i++;
			}
			String num = json.substring(start, i).trim();
			if (num.isEmpty()) {
				return Optional.empty();
			}
			return Optional.of(Double.parseDouble(num));
		}
		catch (NumberFormatException e) {
			return Optional.empty();
		}
	}
}
