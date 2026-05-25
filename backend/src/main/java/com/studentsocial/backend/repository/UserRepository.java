package com.studentsocial.backend.repository;

import com.studentsocial.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    // ── Search by email prefix (case-insensitive) ─────────────────────────
    // Used by GET /api/users/search?q=... to find users by email fragment.
    // LOWER() on both sides handles the citext column correctly in native SQL.
    // Limited to 20 results to keep response fast.
    @Query(value = """
            SELECT u.* FROM "user" u
            LEFT JOIN profile p ON p.user_id = u.id
            WHERE u.deleted_at IS NULL
              AND u.is_active = TRUE
              AND (
                  LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%'))
                  OR LOWER(p.display_name) LIKE LOWER(CONCAT('%', :q, '%'))
              )
            LIMIT 20
            """, nativeQuery = true)
    List<User> searchByEmailOrDisplayName(@Param("q") String q);

    // ── Exact email lookup ────────────────────────────────────────────────
    // Used by DM modal: user types an email, we resolve it to a UUID.
    // Returns empty if the user is deleted or inactive.
    @Query("""
            SELECT u FROM User u
            WHERE LOWER(u.email) = LOWER(:email)
              AND u.deletedAt IS NULL
              AND u.isActive = TRUE
            """)
    Optional<User> findActiveByEmail(@Param("email") String email);
}