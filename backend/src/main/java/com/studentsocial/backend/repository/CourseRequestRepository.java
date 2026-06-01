package com.studentsocial.backend.repository;

import com.studentsocial.backend.model.CourseRequestEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CourseRequestRepository extends JpaRepository<CourseRequestEntity, UUID> {
}