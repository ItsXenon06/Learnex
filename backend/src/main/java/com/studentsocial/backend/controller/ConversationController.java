package com.studentsocial.backend.controller;

import com.studentsocial.backend.dto.request.CreateConversationRequest;
import com.studentsocial.backend.dto.request.SendMessageRequest;
import com.studentsocial.backend.dto.response.ApiResponse;
import com.studentsocial.backend.dto.response.ConversationResponse;
import com.studentsocial.backend.dto.response.MessagePageResponse;
import com.studentsocial.backend.dto.response.MessageResponse;
import com.studentsocial.backend.repository.UserRepository;
import com.studentsocial.backend.service.MessagingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class ConversationController {

    private final MessagingService messagingService;
    private final UserRepository   userRepository;

    // ── Resolve UUID from JWT principal ───────────────────────────────────
    private UUID resolveUserId(UserDetails principal) {
        return userRepository.findByEmail(principal.getUsername())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"))
                .getId();
    }

    // ── POST /api/conversations ───────────────────────────────────────────
    // Start a DM. Returns existing conversation if one already exists.
    // Body: { "recipientId": "..." }
    // Caller's userId is resolved from JWT — not trusted from body.
    @PostMapping("/api/conversations")
    public ResponseEntity<ApiResponse<ConversationResponse>> startDm(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody CreateConversationRequest request) {

        // Overwrite userId with JWT-resolved value so client can't forge sender
        request.setUserId(resolveUserId(principal));
        ConversationResponse response = messagingService.startDm(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    // ── GET /api/conversations ────────────────────────────────────────────
    // List all conversations for the authenticated user with last-message
    // preview and unread count. No query params needed.
    @GetMapping("/api/conversations")
    public ResponseEntity<ApiResponse<List<ConversationResponse>>> getConversations(
            @AuthenticationPrincipal UserDetails principal) {

        UUID userId = resolveUserId(principal);
        List<ConversationResponse> conversations = messagingService.getConversations(userId);
        return ResponseEntity.ok(ApiResponse.success(conversations));
    }

    // ── POST /api/conversations/{convId}/messages ─────────────────────────
    // Send a message. Fires a 'message' notification to all other members.
    // Body: { "content": "...", "replyToId": "(optional)" }
    // Caller's userId is resolved from JWT.
    @PostMapping("/api/conversations/{convId}/messages")
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(
            @PathVariable UUID convId,
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody SendMessageRequest request) {

        request.setUserId(resolveUserId(principal));
        MessageResponse response = messagingService.sendMessage(convId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    // ── GET /api/conversations/{convId}/messages ──────────────────────────
    // Get paginated messages for a conversation, newest first.
    // Caller must be a member of the conversation.
    @GetMapping("/api/conversations/{convId}/messages")
    public ResponseEntity<ApiResponse<MessagePageResponse>> getMessages(
            @PathVariable UUID convId,
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {

        UUID userId = resolveUserId(principal);
        MessagePageResponse response = messagingService.getMessages(convId, userId, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ── PUT /api/conversations/{convId}/messages/{msgId}/read ─────────────
    // Mark a specific message as read by advancing the caller's last_read_at.
    @PutMapping("/api/conversations/{convId}/messages/{msgId}/read")
    public ResponseEntity<ApiResponse<Void>> markRead(
            @PathVariable UUID convId,
            @PathVariable UUID msgId,
            @AuthenticationPrincipal UserDetails principal) {

        UUID userId = resolveUserId(principal);
        messagingService.markRead(convId, msgId, userId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
    // ── POST /api/conversations/group ─────────────────────────────────────────
// Create a named group conversation.
// Body: { "name": "Study Squad", "memberIds": ["uuid1", "uuid2", ...] }
// Caller is automatically added as owner.
@PostMapping("/api/conversations/group")
public ResponseEntity<ApiResponse<ConversationResponse>> createGroupChat(
        @AuthenticationPrincipal UserDetails principal,
        @RequestBody Map<String, Object> body) {
 
    UUID creatorId = resolveUserId(principal);
    String name     = (String) body.getOrDefault("name", "Group Chat");
    String groupTag = (String) body.get("groupTag"); // "grp:{studyGroupId}" or null
 
    @SuppressWarnings("unchecked")
    List<String> memberIdStrings = (List<String>) body.getOrDefault("memberIds", List.of());
    List<UUID> memberIds = memberIdStrings.stream().map(UUID::fromString).toList();
 
    ConversationResponse response =
            messagingService.createOrGetGroupChat(creatorId, name, memberIds, groupTag);
    return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
}
}