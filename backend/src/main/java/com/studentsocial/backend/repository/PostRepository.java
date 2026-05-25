package com.studentsocial.backend.repository;

import com.studentsocial.backend.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PostRepository extends JpaRepository<Post, UUID> {

    Optional<Post> findByIdAndDeletedAtIsNull(UUID id);

    // Profile page: all posts by a specific author, newest first
    @Query("""
        SELECT p FROM Post p
        WHERE p.author.id = :authorId
          AND p.deletedAt IS NULL
        ORDER BY p.createdAt DESC
        LIMIT :size OFFSET :offset
        """)
    List<Post> findByAuthorIdAndDeletedAtIsNull(
        @Param("authorId") UUID authorId,
        @Param("offset")   int  offset,
        @Param("size")     int  size);

    // Feed: posts from followed users + self, with visibility rules:
    //   - author's OWN posts: show all visibilities (public, connections, private)
    //   - other authors: only 'public' and 'connections' (never 'private')
    //
    // FIX: previously returned ALL posts from followed users including
    // visibility='private', so followers could see private posts.
    // The :viewerId param is the requesting user's UUID (always in :userIds too).
    @Query(value = """
            SELECT * FROM post
            WHERE deleted_at IS NULL
              AND author_id IN :userIds
              AND (
                author_id = :viewerId
                OR visibility IN ('public', 'connections')
              )
            ORDER BY created_at DESC
            LIMIT :lim OFFSET :off
            """, nativeQuery = true)
    List<Post> findFeedByUserIds(
            @Param("userIds")   List<UUID> userIds,
            @Param("viewerId")  UUID       viewerId,
            @Param("off")       int        offset,
            @Param("lim")       int        limit);

    // Discover: all public posts, newest first, paginated
    @Query(value = """
            SELECT * FROM post
            WHERE deleted_at IS NULL
              AND visibility = 'public'
            ORDER BY created_at DESC
            LIMIT :lim OFFSET :off
            """, nativeQuery = true)
    List<Post> findDiscover(
            @Param("off") int offset,
            @Param("lim") int limit);
}