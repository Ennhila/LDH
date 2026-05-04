package com.ldh.backend.domain;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "price_matrix_cells")
@Getter
@Setter
public class PriceMatrixCell {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "origin_zone_id", nullable = false)
	private ShippingZone originZone;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "dest_zone_id", nullable = false)
	private ShippingZone destZone;

	@Column(name = "base_price", nullable = false, precision = 12, scale = 2)
	private BigDecimal basePrice = BigDecimal.ZERO;

	@Column(name = "price_per_kg_over_1", precision = 12, scale = 2)
	private BigDecimal pricePerKgOver1 = BigDecimal.ZERO;

	@Column(name = "price_per_kg_over_5", precision = 12, scale = 2)
	private BigDecimal pricePerKgOver5 = BigDecimal.ZERO;

	@Column(name = "price_per_kg_over_20", precision = 12, scale = 2)
	private BigDecimal pricePerKgOver20 = BigDecimal.ZERO;

	@Column(name = "fuel_surcharge", precision = 12, scale = 2)
	private BigDecimal fuelSurcharge = BigDecimal.ZERO;

	@Column(name = "remote_area_surcharge", precision = 12, scale = 2)
	private BigDecimal remoteAreaSurcharge = BigDecimal.ZERO;

	@Column(name = "valid_from")
	private LocalDate validFrom;

	@Column(name = "valid_to")
	private LocalDate validTo;

	@Column(nullable = false)
	private boolean active = true;
}
