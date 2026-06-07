package com.studentsocial.backend.service;

import com.studentsocial.backend.dto.request.CourseRequestDto;
import com.studentsocial.backend.dto.response.CourseRequestResponse;
import com.studentsocial.backend.dto.response.CourseResponse;
import com.studentsocial.backend.exception.ResourceNotFoundException;
import com.studentsocial.backend.model.Course;
import com.studentsocial.backend.model.CourseRequestEntity;
import com.studentsocial.backend.model.User;
import com.studentsocial.backend.repository.CourseRepository;
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

    private final CourseRepository        courseRepository;
    private final CourseRequestRepository courseRequestRepository;
    private final UserRepository          userRepository;
    private final EmailService            emailService;

    @Value("${spring.mail.username:}")
    private String adminEmail;

    // ── Color palette cycled by index so new courses auto-get a color ─────
    private static final String[][] PALETTE = {
        { "rgba(74,158,255,.2)",  "#4a9eff"  },
        { "rgba(34,197,94,.2)",   "#22c55e"  },
        { "rgba(155,89,245,.2)",  "#9b59f5"  },
        { "rgba(239,159,39,.2)",  "#EF9F27"  },
        { "rgba(232,25,44,.2)",   "#E8192C"  },
        { "rgba(201,168,76,.2)",  "#C9A84C"  },
        { "rgba(74,201,226,.2)",  "#4ac9e2"  },
        { "rgba(255,107,53,.2)",  "#ff6b35"  },
    };

    // ── Read from DB ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<CourseResponse> getAllCourses() {
        List<Course> courses = courseRepository.findAll();
        return mapList(courses);
    }

    @Transactional(readOnly = true)
    public CourseResponse getCourse(UUID id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + id));
        return mapOne(course, 0);
    }

    // ── Course request ────────────────────────────────────────────────────

    @Transactional
    public CourseRequestResponse submitRequest(UUID userId, CourseRequestDto dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        CourseRequestEntity entity = courseRequestRepository.save(
                CourseRequestEntity.builder()
                        .user(user)
                        .courseName(dto.getCourseName())
                        .reason(dto.getReason())
                        .courseCode(dto.getCourseCode())
                        .schoolName(dto.getSchoolName())
                        .build());

        if (adminEmail != null && !adminEmail.isBlank()) {
            try {
                String subject = "[Learnex] Course Request: " + dto.getCourseName();
                String body = String.format(
                    "New Course Request\n\n"
                    + "User ID:     %s\n"
                    + "User Email:  %s\n"
                    + "Course Name: %s\n"
                    + "Course Code: %s\n"
                    + "School:      %s\n"
                    + "Reason:      %s",
                    user.getId(), user.getEmail(),
                    dto.getCourseName(),
                    dto.getCourseCode()  != null ? dto.getCourseCode()  : "(not specified)",
                    dto.getSchoolName()  != null ? dto.getSchoolName()  : "(not specified)",
                    dto.getReason()      != null ? dto.getReason()      : "(none)"
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

    // ── Mapping helpers ───────────────────────────────────────────────────

    private List<CourseResponse> mapList(List<Course> courses) {
        for (int i = 0; i < courses.size(); i++) {
            // index captured for lambda
        }
        // Use indexed stream so each course gets a stable palette color
        var result = new java.util.ArrayList<CourseResponse>(courses.size());
        for (int i = 0; i < courses.size(); i++) {
            result.add(mapOne(courses.get(i), i));
        }
        return result;
    }

    private CourseResponse mapOne(Course course, int index) {
        String[] colors = PALETTE[index % PALETTE.length];
        String deptName = course.getDepartment() != null
                ? course.getDepartment().getName()
                : "General";

        return CourseResponse.builder()
                .id(course.getId())
                .code(course.getCode())
                .name(course.getName())
                .department(deptName)
                .enrolled(0)          // extend later with an enrollment count query
                .color(colors[0])
                .accent(colors[1])
                .build();
    }
}