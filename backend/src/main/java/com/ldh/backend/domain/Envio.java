package com.ldh.backend.domain;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "envios")
@Getter
@Setter
public class Envio {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "tracking_number", nullable = false, unique = true, length = 32)
	private String trackingNumber;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "client_user_id", nullable = false)
	private User client;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "assigned_repartidor_id")
	private User assignedRepartidor;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 32)
	private EnvioStatus status = EnvioStatus.PENDING;

	@Column(name = "origin_address", length = 512)
	private String originAddress;

	@Column(name = "origin_postal_code", length = 10)
	private String originPostalCode;

	@Column(name = "destination_address", length = 512)
	private String destinationAddress;

	@Column(name = "destination_postal_code", length = 10)
	private String destinationPostalCode;

	@Column(name = "package_weight_kg")
	private Double packageWeightKg;

	@Column(name = "package_length_cm")
	private Double packageLengthCm;

	@Column(name = "package_width_cm")
	private Double packageWidthCm;

	@Column(name = "package_height_cm")
	private Double packageHeightCm;

	@Column(name = "sender_name")
	private String senderName;

	@Column(name = "sender_phone", length = 32)
	private String senderPhone;

	@Column(name = "recipient_name")
	private String recipientName;

	@Column(name = "recipient_phone", length = 32)
	private String recipientPhone;

	@Column(name = "total_amount_cents")
	private Long totalAmountCents;

	@Column(length = 8)
	private String currency = "EUR";

	@Column(length = 1024)
	private String notes;

	/** JSON del asistente (factura/etiqueta) sin depender del almacenamiento del navegador. */
	@Lob
	@Column(name = "checkout_snapshot_json")
	private String checkoutSnapshotJson;

	@Column(name = "current_latitude")
	private Double currentLatitude;

	@Column(name = "current_longitude")
	private Double currentLongitude;

	@Column(name = "last_location_label", length = 255)
	private String lastLocationLabel;

	@Column(name = "exception_reason", length = 255)
	private String exceptionReason;

	@Lob
	@Column(name = "exception_notes")
	private String exceptionNotes;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	@PrePersist
	void prePersist() {
		Instant now = Instant.now();
		createdAt = now;
		updatedAt = now;
	}

	@PreUpdate
	void preUpdate() {
		updatedAt = Instant.now();
	}
}
