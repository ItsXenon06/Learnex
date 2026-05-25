package com.studentsocial.backend.repository;

import com.studentsocial.backend.model.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    // All notifications for a user, newest first — paginated
    @Query("""
        SELECT n FROM Notification n
        WHERE n.user.id = :userId
        ORDER BY n.createdAt DESC
    """)
    Page<Notification> findByUserId(@Param("userId") UUID userId, Pageable pageable);

    // Unread only — uses the partial index on (user_id, created_at DESC) WHERE is_read = FALSE
    @Query("""
        SELECT n FROM Notification n
        WHERE n.user.id = :userId
          AND n.isRead = false
        ORDER BY n.createdAt DESC
    """)
    Page<Notification> findUnreadByUserId(@Param("userId") UUID userId, Pageable pageable);

    long countByUserIdAndIsReadFalse(UUID userId);

    Optional<Notification> findByIdAndUserId(UUID id, UUID userId);

    // Mark a single notification as read
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.id = :id AND n.user.id = :userId")
    int markAsRead(@Param("id") UUID id, @Param("userId") UUID userId);

    // Mark ALL notifications for a user as read
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.user.id = :userId AND n.isRead = false")
    int markAllAsRead(@Param("userId") UUID userId);
}