package com.studentsocial.backend.repository;
import com.studentsocial.backend.repository.MediaFileRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;
import com.studentsocial.backend.model.MediaFile;

@Repository
public interface MediaFileRepository extends JpaRepository<MediaFile, UUID> {}
