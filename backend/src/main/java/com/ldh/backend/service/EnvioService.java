package com.ldh.backend.service;

import java.security.SecureRandom;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.ldh.backend.domain.Envio;
import com.ldh.backend.domain.EnvioStatus;
import com.ldh.backend.domain.EnvioStatusAudit;
import com.ldh.backend.domain.User;
import com.ldh.backend.repository.EnvioRepository;
import com.ldh.backend.repository.EnvioStatusAuditRepository;
import com.ldh.backend.repository.UserRepository;
import com.ldh.backend.security.UserPrincipal;
import com.ldh.backend.web.dto.ClientCheckoutSnapshotResponse;
import com.ldh.backend.web.dto.EnvioCreateRequest;
import com.ldh.backend.web.dto.EnvioResponse;
import com.ldh.backend.web.dto.EnvioStatusAuditResponse;
import com.ldh.backend.web.dto.EnvioStatusUpdateRequest;

@Service
public class EnvioService {

	private static final String TRACKING_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	private static final SecureRandom RANDOM = new SecureRandom();

	private final EnvioRepository envioRepository;
	private final UserRepository userRepository;
	private final EnvioStatusAuditRepository envioStatusAuditRepository;

	public EnvioService(EnvioRepository envioRepository, UserRepository userRepository,
			EnvioStatusAuditRepository envioStatusAuditRepository) {
		this.envioRepository = envioRepository;
		this.userRepository = userRepository;
		this.envioStatusAuditRepository = envioStatusAuditRepository;
	}

	@Transactional(readOnly = true)
	public List<EnvioResponse> listAllForAdmin() {
		return envioRepository.findAllWithUsers().stream().map(this::toResponse).toList();
	}

	@Transactional(readOnly = true)
	public List<EnvioResponse> listForClient(UserPrincipal principal) {
		return envioRepository.findByClientIdWithUsers(principal.id()).stream().map(this::toResponse).toList();
	}

	@Transactional(readOnly = true)
	public List<EnvioResponse> listForRepartidor() {
		return envioRepository.findAllWithUsers().stream().map(this::toResponse).toList();
	}

	@Transactional(readOnly = true)
	public EnvioResponse trackPublic(String trackingNumber) {
		Envio e = envioRepository.findByTrackingNumberWithUsers(trackingNumber.trim())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Envío no encontrado"));
		return toResponse(e);
	}

	@Transactional(readOnly = true)
	public ClientCheckoutSnapshotResponse getCheckoutSnapshotForClient(UserPrincipal principal, String trackingNumber) {
		Envio e = envioRepository.findByTrackingNumberWithUsers(trackingNumber.trim())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Envío no encontrado"));
		if (!e.getClient().getId().equals(principal.id())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No autorizado");
		}
		String json = e.getCheckoutSnapshotJson();
		if (json == null || json.isBlank()) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND,
					"No hay datos de factura guardados para este envío");
		}
		return new ClientCheckoutSnapshotResponse(e.getTrackingNumber(), e.getCreatedAt().toString(), json);
	}

	@Transactional(readOnly = true)
	public ClientCheckoutSnapshotResponse getCheckoutSnapshotForAdmin(Long envioId) {
		Envio e = envioRepository.findById(envioId).orElseThrow(() -> envioNotFound(envioId));
		String json = e.getCheckoutSnapshotJson();
		if (json == null || json.isBlank()) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND,
					"No hay datos de factura guardados para este envío");
		}
		return new ClientCheckoutSnapshotResponse(e.getTrackingNumber(), e.getCreatedAt().toString(), json);
	}

	@Transactional(readOnly = true)
	public List<EnvioStatusAuditResponse> listAuditForEnvio(Long envioId) {
		envioRepository.findById(envioId).orElseThrow(() -> envioNotFound(envioId));
		return envioStatusAuditRepository.findByEnvioIdOrderByChangedAtDesc(envioId).stream()
				.map(this::auditToResponse)
				.toList();
	}

	@Transactional
	public EnvioResponse createForClient(UserPrincipal principal, EnvioCreateRequest request) {
		User client = userRepository.findById(principal.id())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no válido"));
		Envio e = new Envio();
		e.setTrackingNumber(generateUniqueTrackingNumber());
		e.setClient(client);
		e.setStatus(EnvioStatus.PENDING);
		e.setOriginAddress(trimToNull(request.originAddress()));
		e.setOriginPostalCode(trimToNull(request.originPostalCode()));
		e.setDestinationAddress(trimToNull(request.destinationAddress()));
		e.setDestinationPostalCode(request.destinationPostalCode().trim());
		e.setPackageWeightKg(request.packageWeightKg());
		e.setPackageLengthCm(request.packageLengthCm());
		e.setPackageWidthCm(request.packageWidthCm());
		e.setPackageHeightCm(request.packageHeightCm());
		e.setSenderName(trimToNull(request.senderName()));
		e.setSenderPhone(trimToNull(request.senderPhone()));
		e.setRecipientName(trimToNull(request.recipientName()));
		e.setRecipientPhone(trimToNull(request.recipientPhone()));
		e.setTotalAmountCents(request.totalAmountCents());
		e.setNotes(trimToNull(request.notes()));
		String snap = trimToNull(request.checkoutSnapshotJson());
		if (snap != null) {
			if (snap.length() > 524_288) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "checkoutSnapshotJson demasiado grande");
			}
			e.setCheckoutSnapshotJson(snap);
		}
		return toResponse(envioRepository.save(e));
	}

	@Transactional
	public EnvioResponse updateStatusByRepartidor(Long envioId, UserPrincipal repartidor,
			EnvioStatusUpdateRequest request) {
		Envio e = envioRepository.findById(envioId).orElseThrow(() -> envioNotFound(envioId));
		EnvioStatus old = e.getStatus();
		applyStatusPayload(e, request);
		User rep = userRepository.findById(repartidor.id()).orElseThrow();
		e.setAssignedRepartidor(rep);
		Envio saved = envioRepository.save(e);
		if (old != saved.getStatus()) {
			saveAudit(saved, old, saved.getStatus(), rep, null);
		}
		return toResponse(saved);
	}

	@Transactional
	public EnvioResponse updateStatusByAdmin(Long envioId, UserPrincipal admin, EnvioStatusUpdateRequest request) {
		Envio e = envioRepository.findById(envioId).orElseThrow(() -> envioNotFound(envioId));
		EnvioStatus old = e.getStatus();
		applyStatusPayload(e, request);
		User actor = userRepository.findById(admin.id()).orElseThrow();
		Envio saved = envioRepository.save(e);
		if (old != saved.getStatus()) {
			saveAudit(saved, old, saved.getStatus(), actor, null);
		}
		return toResponse(saved);
	}

	private void applyStatusPayload(Envio e, EnvioStatusUpdateRequest request) {
		EnvioStatus newSt = request.status();
		if (newSt == EnvioStatus.EXCEPTION) {
			String reason = trimToNull(request.exceptionReason());
			if (reason == null) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Motivo de incidencia obligatorio");
			}
			e.setExceptionReason(reason);
			e.setExceptionNotes(trimToNull(request.exceptionNotes()));
		} else {
			e.setExceptionReason(null);
			e.setExceptionNotes(null);
		}
		e.setStatus(newSt);
		if (request.currentLatitude() != null) {
			e.setCurrentLatitude(request.currentLatitude());
		}
		if (request.currentLongitude() != null) {
			e.setCurrentLongitude(request.currentLongitude());
		}
		if (request.lastLocationLabel() != null) {
			e.setLastLocationLabel(request.lastLocationLabel().trim());
		}
	}

	private void saveAudit(Envio envio, EnvioStatus old, EnvioStatus newStatus, User actor, String notes) {
		EnvioStatusAudit a = new EnvioStatusAudit();
		a.setEnvio(envio);
		a.setOldStatus(old);
		a.setNewStatus(newStatus);
		a.setChangedAt(java.time.Instant.now());
		a.setActorUser(actor);
		a.setActorEmail(actor != null ? actor.getEmail() : null);
		a.setNotes(trimToNull(notes));
		envioStatusAuditRepository.save(a);
	}

	private EnvioStatusAuditResponse auditToResponse(EnvioStatusAudit a) {
		return new EnvioStatusAuditResponse(
				a.getId(),
				a.getOldStatus(),
				a.getNewStatus(),
				a.getChangedAt(),
				a.getActorUser() != null ? a.getActorUser().getId() : null,
				a.getActorEmail(),
				a.getNotes());
	}

	private String generateUniqueTrackingNumber() {
		for (int i = 0; i < 20; i++) {
			String candidate = "LDH-" + randomChunk(4) + "-" + randomChunk(4);
			if (envioRepository.findByTrackingNumberIgnoreCase(candidate).isEmpty()) {
				return candidate;
			}
		}
		throw new IllegalStateException("No se pudo generar número de seguimiento");
	}

	private String randomChunk(int len) {
		StringBuilder sb = new StringBuilder(len);
		for (int i = 0; i < len; i++) {
			sb.append(TRACKING_ALPHABET.charAt(RANDOM.nextInt(TRACKING_ALPHABET.length())));
		}
		return sb.toString();
	}

	private EnvioResponse toResponse(Envio e) {
		return new EnvioResponse(
				e.getId(),
				e.getTrackingNumber(),
				e.getStatus(),
				e.getOriginAddress(),
				e.getOriginPostalCode(),
				e.getDestinationAddress(),
				e.getDestinationPostalCode(),
				e.getPackageWeightKg(),
				e.getPackageLengthCm(),
				e.getPackageWidthCm(),
				e.getPackageHeightCm(),
				e.getSenderName(),
				e.getSenderPhone(),
				e.getRecipientName(),
				e.getRecipientPhone(),
				e.getTotalAmountCents(),
				e.getCurrency(),
				e.getNotes(),
				e.getCurrentLatitude(),
				e.getCurrentLongitude(),
				e.getLastLocationLabel(),
				e.getClient().getEmail(),
				e.getAssignedRepartidor() != null ? e.getAssignedRepartidor().getId() : null,
				e.getCreatedAt(),
				e.getUpdatedAt(),
				e.getExceptionReason(),
				e.getExceptionNotes());
	}

	private static String trimToNull(String s) {
		if (s == null) {
			return null;
		}
		String t = s.trim();
		return t.isEmpty() ? null : t;
	}

	private static ResponseStatusException envioNotFound(Long id) {
		return new ResponseStatusException(HttpStatus.NOT_FOUND, "Envío no encontrado: " + id);
	}
}
