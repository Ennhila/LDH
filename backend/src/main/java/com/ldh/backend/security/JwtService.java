package com.ldh.backend.security;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Service;

import com.ldh.backend.config.JwtProperties;
import com.ldh.backend.domain.Role;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

	private final JwtProperties properties;
	private final SecretKey key;

	public JwtService(JwtProperties properties) {
		this.properties = properties;
		this.key = Keys.hmacShaKeyFor(properties.secret().getBytes(StandardCharsets.UTF_8));
	}

	public String createToken(String email, Role role) {
		long now = System.currentTimeMillis();
		return Jwts.builder()
				.subject(email)
				.claim("role", role.name())
				.issuedAt(new Date(now))
				.expiration(new Date(now + properties.expirationMs()))
				.signWith(key)
				.compact();
	}

	public String extractEmail(String token) {
		return parseClaims(token).getSubject();
	}

	public Role extractRole(String token) {
		String r = parseClaims(token).get("role", String.class);
		return Role.valueOf(r);
	}

	private Claims parseClaims(String token) {
		return Jwts.parser()
				.verifyWith(key)
				.build()
				.parseSignedClaims(token)
				.getPayload();
	}

	public boolean isValid(String token) {
		try {
			parseClaims(token);
			return true;
		}
		catch (Exception e) {
			return false;
		}
	}
}
