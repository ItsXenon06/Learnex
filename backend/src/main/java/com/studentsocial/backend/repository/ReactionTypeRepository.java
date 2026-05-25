package com.studentsocial.backend.repository;

import com.studentsocial.backend.model.ReactionType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ReactionTypeRepository extends JpaRepository<ReactionType, UUID> {
    Optional<ReactionType> findByName(String name);
}