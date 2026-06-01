package com.studentsocial.backend.controller;

import com.studentsocial.backend.dto.response.ApiResponse;
import com.studentsocial.backend.service.CourseService;
import com.studentsocial.backend.dto.request.CourseRequestDto;
import com.studentsocial.backend.dto.response.CourseResponse;
import com.studentsocial.backend.dto.response.CourseRequestResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import com.studentsocial.backend.repository.UserRepository;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;
    private final UserRepository userRepository;

    private UUID resolveUserId(UserDetails principal) {
        return userRepository.findByEmail(principal.getUsername())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"))
                .getId();
    }

    // GET /api/courses — returns all available courses
    @GetMapping
    public ResponseEntity<ApiResponse<List<CourseResponse>>> getCourses() {
        return ResponseEntity.ok(ApiResponse.success(courseService.getAllCourses()));
    }

    // GET /api/courses/{id}
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CourseResponse>> getCourse(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(courseService.getCourse(id)));
    }

    // POST /api/courses/request — submit a course request
    @PostMapping("/request")
    public ResponseEntity<ApiResponse<CourseRequestResponse>> requestCourse(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody CourseRequestDto request) {

        UUID userId = resolveUserId(principal);
        return ResponseEntity.ok(ApiResponse.success(courseService.submitRequest(userId, request)));
    }
}