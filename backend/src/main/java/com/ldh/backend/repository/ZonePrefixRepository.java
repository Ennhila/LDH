package com.ldh.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ldh.backend.domain.ZonePrefix;

public interface ZonePrefixRepository extends JpaRepository<ZonePrefix, Long> {

	@Query("""
			select zp from ZonePrefix zp join fetch zp.zone z
			where upper(zp.prefix) = upper(:prefix)
			""")
	Optional<ZonePrefix> findByPrefixIgnoreCase(@Param("prefix") String prefix);

	boolean existsByZoneIdAndPrefixIgnoreCase(Long zoneId, String prefix);
}
