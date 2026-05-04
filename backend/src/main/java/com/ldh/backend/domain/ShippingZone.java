package com.ldh.backend.domain;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "shipping_zones")
@Getter
@Setter
public class ShippingZone {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true, length = 64)
	private String code;

	@Column(nullable = false)
	private String name;

	@Column(nullable = false)
	private boolean international;

	@Column(name = "display_order", nullable = false)
	private int displayOrder;

	@Column(name = "flag_emoji", length = 16)
	private String flagEmoji;

	@OneToMany(mappedBy = "zone", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderBy("prefix")
	private List<ZonePrefix> prefixes = new ArrayList<>();
}
