package com.ldh.backend.config;
//  Binding props JWT (`app.jwt.*`) | Tipado config | Spring `@ConfigurationProperties` 
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.jwt")
public record JwtProperties(String secret, long expirationMs) {
}
