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
    @Query(value = """
        SELECT * FROM post
        WHERE deleted_at IS NULL
          AND group_id = :groupId
        ORDER BY created_at DESC
        LIMIT :lim OFFSET :off
        """, nativeQuery = true)
List<Post> findByGroupIdOrderByCreatedAt(
        @Param("groupId") UUID groupId,
        @Param("off")     int  offset,
        @Param("lim")     int  limit);
 
// ── Group feed: sorted by reaction count (last 30 days window) ───────────
@Query(value = """
        SELECT p.* FROM post p
        LEFT JOIN post_reaction pr ON pr.post_id = p.id
        WHERE p.deleted_at IS NULL
          AND p.group_id = :groupId
        GROUP BY p.id
        ORDER BY COUNT(pr.id) DESC, p.created_at DESC
        LIMIT :lim OFFSET :off
        """, nativeQuery = true)
List<Post> findByGroupIdOrderByLikes(
        @Param("groupId") UUID groupId,
        @Param("off")     int  offset,
        @Param("lim")     int  limit);
 
// ── Global feed sorted by likes (24h / 30d / 365d) ──────────────────────
@Query(value = """
        SELECT p.* FROM post p
        LEFT JOIN post_reaction pr ON pr.post_id = p.id
        WHERE p.deleted_at IS NULL
          AND p.visibility = 'public'
          AND p.created_at >= NOW() - CAST(:window AS INTERVAL)
        GROUP BY p.id
        ORDER BY COUNT(pr.id) DESC, p.created_at DESC
        LIMIT :lim OFFSET :off
        """, nativeQuery = true)
List<Post> findDiscoverSortedByLikes(
        @Param("window") String window,   // e.g. "24 hours", "30 days", "365 days"
        @Param("off")    int    offset,
        @Param("lim")    int    limit);
 
// ── Feed sorted by likes for following users ──────────────────────────────
@Query(value = """
        SELECT p.* FROM post p
        LEFT JOIN post_reaction pr ON pr.post_id = p.id
        WHERE p.deleted_at IS NULL
          AND p.author_id IN :userIds
          AND (p.author_id = :viewerId OR p.visibility IN ('public','connections'))
          AND p.created_at >= NOW() - CAST(:window AS INTERVAL)
        GROUP BY p.id
        ORDER BY COUNT(pr.id) DESC, p.created_at DESC
        LIMIT :lim OFFSET :off
        """, nativeQuery = true)
List<Post> findFeedByUserIdsSortedByLikes(
        @Param("userIds")  List<UUID> userIds,
        @Param("viewerId") UUID       viewerId,
        @Param("window")   String     window,
        @Param("off")      int        offset,
        @Param("lim")      int        limit);
@Query(value = """
    SELECT * FROM post
    WHERE deleted_at IS NULL
      AND visibility = 'public'
      AND LOWER(content) LIKE LOWER(CONCAT('%#', :tag, '%'))
    ORDER BY created_at DESC
    LIMIT :lim OFFSET :off
    """, nativeQuery = true)
List<Post> findByHashtag(
    @Param("tag") String tag,
    @Param("off") int offset,
    @Param("lim") int limit);

// ── Course forum: get all posts for a specific course, newest first ──
@Query("""
    SELECT p FROM Post p
    WHERE p.course.id = :courseId
      AND p.deletedAt IS NULL
    ORDER BY p.isPinned DESC, p.createdAt DESC
    """)
List<Post> findByCourseIdOrderByCreatedAtDesc(
    @Param("courseId") UUID courseId);
}
