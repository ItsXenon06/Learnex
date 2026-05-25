package com.studentsocial.backend.repository;

import com.studentsocial.backend.model.Follow;
import com.studentsocial.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FollowRepository extends JpaRepository<Follow, Follow.FollowId> {

    Optional<Follow> findByFollowerIdAndFolloweeId(UUID followerId, UUID followeeId);

    @Query("SELECT f.followee FROM Follow f WHERE f.follower.id = :userId")
    List<User> findFollowingByUserId(UUID userId);

    @Query("SELECT f.follower FROM Follow f WHERE f.followee.id = :userId")
    List<User> findFollowersByUserId(UUID userId);

    boolean existsByFollowerIdAndFolloweeId(UUID followerId, UUID followeeId);
}