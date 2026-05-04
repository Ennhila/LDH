package com.ldh.backend.domain;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "delivery_type_modifiers")
@Getter
@Setter
public class DeliveryTypeModifier {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, unique = true, length = 32)
	private DeliveryTypeCode code;

	@Column(nullable = false, length = 128)
	private String label;

	@Column(nullable = false, precision = 8, scale = 4)
	private BigDecimal multiplier = BigDecimal.ONE;

	@Column(name = "flat_surcharge", nullable = false, precision = 12, scale = 2)
	private BigDecimal flatSurcharge = BigDecimal.ZERO;

	@Column(nullable = false)
	private boolean active = true;
}
