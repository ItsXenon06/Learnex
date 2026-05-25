package com.studentsocial.backend.repository;
import com.studentsocial.backend.model.StudyGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List; import java.util.Optional; import java.util.UUID;

public interface StudyGroupRepository extends JpaRepository<StudyGroup, UUID> {
    Optional<StudyGroup> findByIdAndDeletedAtIsNull(UUID id);

    @Query(value = "SELECT * FROM study_group WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT :lim OFFSET :off", nativeQuery = true)
    List<StudyGroup> findAllByDeletedAtIsNullOrderByCreatedAtDesc(
        @Param("off") int offset, @Param("lim") int size);
}