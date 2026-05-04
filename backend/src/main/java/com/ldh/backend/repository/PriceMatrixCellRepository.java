package com.ldh.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ldh.backend.domain.PriceMatrixCell;

public interface PriceMatrixCellRepository extends JpaRepository<PriceMatrixCell, Long> {

	@EntityGraph(attributePaths = { "originZone", "destZone" })
	List<PriceMatrixCell> findAllByActiveIsTrue();

	Optional<PriceMatrixCell> findByOriginZoneIdAndDestZoneId(Long originZoneId, Long destZoneId);

	@Query("select count(c) from PriceMatrixCell c where c.originZone.id = :zid or c.destZone.id = :zid")
	long countCellsTouchingZone(@Param("zid") Long zoneId);

	@Query("select count(c) from PriceMatrixCell c where (c.originZone.id = :zid or c.destZone.id = :zid) and c.active = true")
	long countActiveCellsTouchingZone(@Param("zid") Long zoneId);
}
