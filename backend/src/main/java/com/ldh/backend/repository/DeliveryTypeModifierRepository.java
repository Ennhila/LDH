package com.ldh.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ldh.backend.domain.DeliveryTypeCode;
import com.ldh.backend.domain.DeliveryTypeModifier;

public interface DeliveryTypeModifierRepository extends JpaRepository<DeliveryTypeModifier, Long> {

	Optional<DeliveryTypeModifier> findByCode(DeliveryTypeCode code);

	List<DeliveryTypeModifier> findAllByOrderByCodeAsc();

	List<DeliveryTypeModifier> findAllByActiveIsTrueOrderByCodeAsc();
}
