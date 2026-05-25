package com.studentsocial.backend.repository;

import com.studentsocial.backend.model.Profile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProfileRepository extends JpaRepository<Profile, UUID> {

    Optional<Profile> findByUserId(UUID userId);

    // HI-1 / HI-2 FIX: batch fetch profiles for multiple users in one query.
    // Used by UserService.batchLoadDisplayNames() and PostService.mapFeedToResponses().
    @Query("SELECT p FROM Profile p WHERE p.user.id IN :userIds")
    List<Profile> findByUserIdIn(@Param("userIds") List<UUID> userIds);
}