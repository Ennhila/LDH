package com.ldh.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ldh.backend.domain.ShippingZone;

public interface ShippingZoneRepository extends JpaRepository<ShippingZone, Long> {

	Optional<ShippingZone> findByCode(String code);

	@EntityGraph(attributePaths = "prefixes")
	@Query("select z from ShippingZone z order by z.displayOrder asc, z.id asc")
	List<ShippingZone> findAllWithPrefixesOrdered();

	List<ShippingZone> findAllByOrderByDisplayOrderAscIdAsc();

	@EntityGraph(attributePaths = "prefixes")
	@Query("select z from ShippingZone z where z.id = :id")
	Optional<ShippingZone> fetchWithPrefixes(@Param("id") Long id);
}
