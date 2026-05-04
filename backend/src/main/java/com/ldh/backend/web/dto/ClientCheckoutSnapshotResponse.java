package com.ldh.backend.web.dto;

/** Datos guardados al crear el envío para la página de éxito sin sessionStorage. */
public record ClientCheckoutSnapshotResponse(
		String trackingNumber,
		String createdAtIso,
		String snapshotPayloadJson) {
}
