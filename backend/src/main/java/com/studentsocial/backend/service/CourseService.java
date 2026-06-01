package com.studentsocial.backend.service;

import com.studentsocial.backend.dto.request.CourseRequestDto;
import com.studentsocial.backend.dto.response.CourseRequestResponse;
import com.studentsocial.backend.dto.response.CourseResponse;
import com.studentsocial.backend.exception.ResourceNotFoundException;
import com.studentsocial.backend.model.CourseRequestEntity;
import com.studentsocial.backend.model.User;
import com.studentsocial.backend.repository.CourseRequestRepository;
import com.studentsocial.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRequestRepository courseRequestRepository;
    private final UserRepository          userRepository;
    private final EmailService            emailService;

    @Value("${spring.mail.username:}")
    private String adminEmail;

    // Static course catalog — TODO: migrate to DB table when CourseRepository is wired
    private static final List<CourseResponse> CATALOG = List.of(
        CourseResponse.builder().id(UUID.fromString("00000000-0000-0000-0000-000000000001"))
            .code("CS301").name("Data Structures & Algorithms")
            .description("Fundamental algorithms, complexity analysis, and data structure design patterns.")
            .department("Computer Science").enrolled(142)
            .color("rgba(74,158,255,.2)").accent("#4a9eff").build(),

        CourseResponse.builder().id(UUID.fromString("00000000-0000-0000-0000-000000000002"))
            .code("MATH201").name("Linear Algebra")
            .description("Vector spaces, matrices, eigenvalues, and applications to machine learning.")
            .department("Mathematics").enrolled(89)
            .color("rgba(34,197,94,.2)").accent("#22c55e").build(),

        CourseResponse.builder().id(UUID.fromString("00000000-0000-0000-0000-000000000003"))
            .code("CS401").name("Operating Systems")
            .description("Process management, memory, file systems, and concurrency primitives.")
            .department("Computer Science").enrolled(98)
            .color("rgba(155,89,245,.2)").accent("#9b59f5").build(),

        CourseResponse.builder().id(UUID.fromString("00000000-0000-0000-0000-000000000004"))
            .code("ENG102").name("Technical Writing")
            .description("Clear communication for engineers: documentation, reports, and presentations.")
            .department("English").enrolled(56)
            .color("rgba(239,159,39,.2)").accent("#EF9F27").build(),

        CourseResponse.builder().id(UUID.fromString("00000000-0000-0000-0000-000000000005"))
            .code("CS201").name("Computer Networks")
            .description("TCP/IP stack, routing, protocols, and distributed systems fundamentals.")
            .department("Computer Science").enrolled(74)
            .color("rgba(232,25,44,.2)").accent("#E8192C").build(),

        CourseResponse.builder().id(UUID.fromString("00000000-0000-0000-0000-000000000006"))
            .code("STAT301").name("Probability & Statistics")
            .description("Statistical inference, hypothesis testing, regression, and Bayesian methods.")
            .department("Statistics").enrolled(61)
            .color("rgba(201,168,76,.2)").accent("#C9A84C").build()
    );

    public List<CourseResponse> getAllCourses() {
        return CATALOG;
    }

    public CourseResponse getCourse(UUID id) {
        return CATALOG.stream()
                .filter(c -> c.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
    }

    @Transactional
    public CourseRequestResponse submitRequest(UUID userId, CourseRequestDto dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        CourseRequestEntity entity = courseRequestRepository.save(
                CourseRequestEntity.builder()
                        .user(user)
                        .courseName(dto.getCourseName())
                        .reason(dto.getReason())
                        .build()
        );

        // Send notification email to admin — fail silently if mail not configured
        if (adminEmail != null && !adminEmail.isBlank()) {
    try {
        String subject = "[Learnex] Course Request: " + dto.getCourseName();
        String body = String.format(
            "Course request from: %s\nCourse: %s\nReason: %s",
            user.getEmail(), dto.getCourseName(),
            dto.getReason() != null ? dto.getReason() : "(none)"
        );
        emailService.sendEmail(adminEmail, subject, body);
    } catch (Exception ex) {
        log.warn("Could not send course request email: {}", ex.getMessage());
    }
}

        return CourseRequestResponse.builder()
                .id(entity.getId())
                .courseName(entity.getCourseName())
                .reason(entity.getReason())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}