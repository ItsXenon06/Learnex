package com.studentsocial.backend.controller;

import com.studentsocial.backend.dto.response.ApiResponse;
import com.studentsocial.backend.dto.request.CreatePostRequest;
import com.studentsocial.backend.dto.response.PostResponse;
import com.studentsocial.backend.service.CourseService;
import com.studentsocial.backend.service.PostService;
import com.studentsocial.backend.dto.request.CourseRequestDto;
import com.studentsocial.backend.dto.response.CourseResponse;
import com.studentsocial.backend.dto.response.CourseRequestResponse;
import com.studentsocial.backend.model.Course;
import com.studentsocial.backend.model.Post;
import com.studentsocial.backend.model.PostAttachment;
import com.studentsocial.backend.repository.CourseRepository;
import com.studentsocial.backend.repository.PostRepository;
import com.studentsocial.backend.repository.PostAttachmentRepository;
import com.studentsocial.backend.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;
    private final PostService postService;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final PostRepository postRepository;
    private final PostAttachmentRepository postAttachmentRepository;

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

    // ── GET /api/courses/{courseId}/posts ────────────────────────────────
    // Returns all forum posts for a course, paginated
    @GetMapping("/{courseId}/posts")
    public ResponseEntity<ApiResponse<Page<PostResponse>>> getCoursePosts(
            @PathVariable UUID courseId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        
        List<Post> posts = postRepository.findByCourseIdOrderByCreatedAtDesc(courseId);
        
        // Manual pagination
        int start = Math.min(page * size, posts.size());
        int end = Math.min(start + size, posts.size());
        List<PostResponse> pageContent = posts.subList(start, end).stream()
                .map(p -> {
                    List<PostAttachment> attachments = postAttachmentRepository.findByPostIdOrderBySortOrderAsc(p.getId());
                    return postService.mapToResponse(
                            p,
                            p.getAuthor(),
                            null,
                            List.of(),
                            0,
                            false,
                            attachments
                    );
                })
                .collect(Collectors.toList());
        
        Page<PostResponse> result = new PageImpl<>(
                pageContent,
                PageRequest.of(page, size),
                posts.size()
        );
        
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ── POST /api/courses/{courseId}/posts ───────────────────────────────
    // Create a forum post in a course
    @PostMapping("/{courseId}/posts")
    public ResponseEntity<ApiResponse<PostResponse>> createCoursePost(
            @PathVariable UUID courseId,
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody CreatePostRequest request) {
        
        UUID userId = resolveUserId(principal);
        
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        
        // Set the course on the request (instead of group)
        request.setCourseId(courseId);
        request.setGroupId(null); // Clear group if accidentally set
        
        PostResponse response = postService.createPost(userId, request);
        return ResponseEntity.status(201).body(ApiResponse.success(response));
    }
}

