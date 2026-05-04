package com.ldh.backend.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ldh.backend.domain.Envio;
import com.ldh.backend.domain.EnvioStatus;

public interface EnvioRepository extends JpaRepository<Envio, Long> {

	Optional<Envio> findByTrackingNumberIgnoreCase(String trackingNumber);

	@Query("select e from Envio e join fetch e.client left join fetch e.assignedRepartidor where lower(e.trackingNumber) = lower(:tn)")
	Optional<Envio> findByTrackingNumberWithUsers(@Param("tn") String trackingNumber);

	@Query("select e from Envio e join fetch e.client left join fetch e.assignedRepartidor where e.client.id = :clientId order by e.createdAt desc")
	List<Envio> findByClientIdWithUsers(@Param("clientId") Long clientId);

	@Query("select e from Envio e join fetch e.client left join fetch e.assignedRepartidor order by e.createdAt desc")
	List<Envio> findAllWithUsers();

	@Query("select count(e) from Envio e where e.createdAt >= :since")
	long countCreatedSince(@Param("since") Instant since);

	@Query("select coalesce(sum(e.totalAmountCents), 0) from Envio e where e.createdAt >= :since and e.status = :status")
	long sumTotalAmountCentsSinceDelivered(@Param("since") Instant since, @Param("status") EnvioStatus status);

	@Query("select e from Envio e where e.createdAt >= :since")
	List<Envio> findByCreatedAtGreaterThanEqual(@Param("since") Instant since);

	@Query("select e from Envio e where e.status = :status and e.updatedAt >= :since")
	List<Envio> findByStatusAndUpdatedAtGreaterThanEqual(@Param("status") EnvioStatus status,
			@Param("since") Instant since);

	@Query("select e.status, count(e) from Envio e group by e.status")
	List<Object[]> countGroupedByStatus();
}
