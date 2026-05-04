package com.ldh.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ldh.backend.domain.EnvioStatusAudit;

public interface EnvioStatusAuditRepository extends JpaRepository<EnvioStatusAudit, Long> {

	List<EnvioStatusAudit> findByEnvioIdOrderByChangedAtDesc(Long envioId);
}
