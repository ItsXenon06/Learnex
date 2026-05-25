package com.studentsocial.backend.repository;

import com.studentsocial.backend.model.GroupRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface GroupRoleRepository extends JpaRepository<GroupRole, UUID> {

    // Used by GroupController when assigning owner/member roles on join/create
    Optional<GroupRole> findByName(String name);
}