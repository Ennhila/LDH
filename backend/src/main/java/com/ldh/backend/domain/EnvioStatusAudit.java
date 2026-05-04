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
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "envio_status_audit")
@Getter
@Setter
public class EnvioStatusAudit {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "envio_id", nullable = false)
	private Envio envio;

	@Enumerated(EnumType.STRING)
	@Column(name = "old_status", length = 32)
	private EnvioStatus oldStatus;

	@Enumerated(EnumType.STRING)
	@Column(name = "new_status", nullable = false, length = 32)
	private EnvioStatus newStatus;

	@Column(name = "changed_at", nullable = false)
	private Instant changedAt;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "actor_user_id")
	private User actorUser;

	@Column(name = "actor_email", length = 255)
	private String actorEmail;

	@Column(length = 512)
	private String notes;
}
