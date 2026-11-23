package com.dsmovie.infrastructure.persistence.repository;

import com.dsmovie.infrastructure.persistence.entity.MovieEntity;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface MovieJpaRepository extends JpaRepository<MovieEntity, Long> {

    boolean existsByTitleIgnoreCase(String title);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select m from MovieEntity m where m.id = :id")
    Optional<MovieEntity> findByIdForUpdate(@Param("id") Long id);
}