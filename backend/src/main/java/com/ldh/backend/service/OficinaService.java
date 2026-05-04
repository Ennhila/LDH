package com.ldh.backend.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.ldh.backend.domain.Oficina;
import com.ldh.backend.geocoding.NominatimGeocodingService;
import com.ldh.backend.repository.OficinaRepository;
import com.ldh.backend.web.dto.OficinaRequest;
import com.ldh.backend.web.dto.OficinaResponse;

@Service
public class OficinaService {

	private final OficinaRepository oficinaRepository;
	private final NominatimGeocodingService geocodingService;

	public OficinaService(OficinaRepository oficinaRepository, NominatimGeocodingService geocodingService) {
		this.oficinaRepository = oficinaRepository;
		this.geocodingService = geocodingService;
	}

	@Transactional(readOnly = true)
	public List<OficinaResponse> list() {
		return oficinaRepository.findAll().stream().map(this::toResponse).toList();
	}

	@Transactional
	public OficinaResponse create(OficinaRequest request) {
		Oficina o = new Oficina();
		apply(o, request);
		return toResponse(oficinaRepository.save(o));
	}

	@Transactional
	public OficinaResponse update(Long id, OficinaRequest request) {
		Oficina o = oficinaRepository.findById(id).orElseThrow(() -> notFound(id));
		apply(o, request);
		return toResponse(oficinaRepository.save(o));
	}

	@Transactional
	public void delete(Long id) {
		if (!oficinaRepository.existsById(id)) {
			throw notFound(id);
		}
		oficinaRepository.deleteById(id);
	}

	private void apply(Oficina o, OficinaRequest request) {
		o.setName(request.name().trim());
		o.setAddressLine(request.addressLine().trim());
		o.setPostalCode(request.postalCode().trim());
		o.setCity(request.city().trim());
		Double lat = request.latitude();
		Double lon = request.longitude();
		if (lat == null && lon == null) {
			o.setLatitude(null);
			o.setLongitude(null);
			geocodingService
					.geocode(o.getAddressLine(), o.getPostalCode(), o.getCity())
					.ifPresent(g -> {
						o.setLatitude(g.latitude());
						o.setLongitude(g.longitude());
					});
		}
		else {
			o.setLatitude(lat);
			o.setLongitude(lon);
		}
	}

	private OficinaResponse toResponse(Oficina o) {
		return new OficinaResponse(o.getId(), o.getName(), o.getAddressLine(), o.getPostalCode(), o.getCity(),
				o.getLatitude(), o.getLongitude(), o.getCreatedAt());
	}

	private static ResponseStatusException notFound(Long id) {
		return new ResponseStatusException(HttpStatus.NOT_FOUND, "Oficina no encontrada: " + id);
	}
}
