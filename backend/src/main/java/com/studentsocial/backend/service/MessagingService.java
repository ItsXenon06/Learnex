package com.studentsocial.backend.service;

import com.studentsocial.backend.dto.request.CreateConversationRequest;
import com.studentsocial.backend.dto.request.SendMessageRequest;
import com.studentsocial.backend.dto.response.ConversationResponse;
import com.studentsocial.backend.dto.response.MessagePageResponse;
import com.studentsocial.backend.dto.response.MessageResponse;
import com.studentsocial.backend.exception.ResourceNotFoundException;
import com.studentsocial.backend.exception.UnauthorizedException;
import com.studentsocial.backend.model.*;
import com.studentsocial.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MessagingService {

    private final ConversationRepository       conversationRepository;
    private final ConversationMemberRepository memberRepository;
    private final MessageRepository            messageRepository;
    private final UserRepository               userRepository;
    private final ProfileRepository            profileRepository;
    private final NotificationService          notificationService;
    private final StudyGroupRepository studyGroupRepository;

    // ---------------------------------------------------------------
    // Conversations
    // ---------------------------------------------------------------

    @Transactional
    public ConversationResponse startDm(CreateConversationRequest request) {
        User initiator = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        User recipient = userRepository.findById(request.getRecipientId())
                .orElseThrow(() -> new ResourceNotFoundException("Recipient not found"));

        if (initiator.getId().equals(recipient.getId())) {
            throw new IllegalArgumentException("Cannot start a conversation with yourself");
        }

        return conversationRepository
                .findExistingDm(initiator.getId(), recipient.getId())
                .map(existing -> toConversationResponse(existing, initiator.getId()))
                .orElseGet(() -> {
                    Conversation conv = conversationRepository.save(
                            Conversation.builder().type("dm").build());
                    memberRepository.save(ConversationMember.builder()
                            .conversation(conv).user(initiator).role("owner").build());
                    memberRepository.save(ConversationMember.builder()
                            .conversation(conv).user(recipient).role("member").build());
                    return toConversationResponse(conv, initiator.getId());
                });
    }
 
@Transactional
public ConversationResponse createOrGetGroupChat(UUID creatorId, String name,
                                                  List<UUID> memberIds,
                                                  String groupTag) {
    // groupTag = "grp:{studyGroupId}" — used as a stable lookup key
    if (groupTag != null && !groupTag.isBlank()) {
        Optional<Conversation> existing =
                conversationRepository.findGroupConversationByTag(groupTag);
        if (existing.isPresent()) {
            // Ensure the caller is a member (they may have joined after creation)
            Conversation conv = existing.get();
            UUID convId = conv.getId();
            if (memberRepository.findByConversationIdAndUserId(convId, creatorId).isEmpty()) {
                User caller = userRepository.findById(creatorId)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                memberRepository.save(ConversationMember.builder()
                        .conversation(conv).user(caller).role("member").build());
            }
            return toConversationResponse(conv, creatorId);
        }
    }
 
    // Not found — create new
    User creator = userRepository.findById(creatorId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
 
    String convName = (groupTag != null && !groupTag.isBlank()) ? groupTag : name;
    String displayName = name; // friendly name stored separately via metadata
 
    Conversation conv = conversationRepository.save(
            Conversation.builder()
                    .type("group")
                    .name(convName)       // "grp:{uuid}" — stable key
                    .build());
 
    memberRepository.save(ConversationMember.builder()
            .conversation(conv).user(creator).role("owner").build());
 
    for (UUID memberId : memberIds) {
        if (memberId.equals(creatorId)) continue;
        userRepository.findById(memberId).ifPresent(member ->
                memberRepository.save(ConversationMember.builder()
                        .conversation(conv).user(member).role("member").build())
        );
    }
 
    return toConversationResponse(conv, creatorId);
}
 
    @Transactional(readOnly = true)
    public List<ConversationResponse> getConversations(UUID userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return conversationRepository.findAllByMemberId(userId).stream()
                .map(conv -> toConversationResponse(conv, userId))
                .toList();
    }

    // ---------------------------------------------------------------
    // Messages
    // ---------------------------------------------------------------

    @Transactional
    public MessageResponse sendMessage(UUID convId, SendMessageRequest request) {
        Conversation conv = conversationRepository.findById(convId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        User sender = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        memberRepository.findByConversationIdAndUserId(convId, sender.getId())
                .orElseThrow(() -> new UnauthorizedException(
                        "You are not a member of this conversation"));

        Message.MessageBuilder builder = Message.builder()
                .conversation(conv).sender(sender).content(request.getContent());

        if (request.getReplyToId() != null) {
            Message replyTo = messageRepository
                    .findByIdAndConversationId(request.getReplyToId(), convId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Replied-to message not found in this conversation"));
            builder.replyTo(replyTo);
        }

        Message saved = messageRepository.save(builder.build());

        String senderName = profileRepository.findByUserId(sender.getId())
                .map(p -> p.getDisplayName() != null ? p.getDisplayName() : sender.getEmail())
                .orElse(sender.getEmail());

        memberRepository.findByConversationId(convId).forEach(member -> {
            if (!member.getUser().getId().equals(sender.getId())) {
                notificationService.sendMessage(
                        member.getUser().getId(), sender.getId(),
                        senderName, convId, saved.getId());
            }
        });

        return toMessageResponse(saved);
    }

    @Transactional(readOnly = true)
    public MessagePageResponse getMessages(UUID convId, UUID userId, int page, int size) {
        conversationRepository.findById(convId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        memberRepository.findByConversationIdAndUserId(convId, userId)
                .orElseThrow(() -> new UnauthorizedException(
                        "You are not a member of this conversation"));

        Page<Message> result = messageRepository.findByConversationId(
                convId, PageRequest.of(page, size));

        return MessagePageResponse.builder()
                .messages(result.getContent().stream().map(this::toMessageResponse).toList())
                .page(result.getNumber()).size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .hasNext(result.hasNext())
                .build();
    }

    @Transactional
    public void markRead(UUID convId, UUID msgId, UUID userId) {
        conversationRepository.findById(convId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        messageRepository.findByIdAndConversationId(msgId, convId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Message not found in this conversation"));
        ConversationMember member = memberRepository
                .findByConversationIdAndUserId(convId, userId)
                .orElseThrow(() -> new UnauthorizedException(
                        "You are not a member of this conversation"));
        member.setLastReadAt(LocalDateTime.now());
        memberRepository.save(member);
    }

    // ---------------------------------------------------------------
    // Private helpers
    // ---------------------------------------------------------------

    // MD-4 FIX: previous version had dead lambda + scoping confusion for
    // otherUserId/otherEmail/otherDisplayName. Rewritten cleanly with a single
    // stream find + local variable block — no lambda variable capture needed.
    private ConversationResponse toConversationResponse(Conversation conv, UUID viewerId) {
        List<ConversationMember> members = memberRepository.findByConversationId(conv.getId());

        UUID   otherUserId      = null;
        String otherEmail       = null;
        String otherDisplayName = null;

        if ("dm".equals(conv.getType())) {
            for (ConversationMember m : members) {
                if (!m.getUser().getId().equals(viewerId)) {
                    otherUserId = m.getUser().getId();
                    otherEmail  = m.getUser().getEmail();
                    otherDisplayName = profileRepository.findByUserId(otherUserId)
                            .map(Profile::getDisplayName).orElse(null);
                    break;
                }
            }
        }

        MessageResponse lastMessage = messageRepository.findLastMessage(conv.getId())
                .map(this::toMessageResponse).orElse(null);

        long unreadCount = memberRepository.countUnread(conv.getId(), viewerId);

        return ConversationResponse.builder()
                .id(conv.getId()).type(conv.getType()).name(conv.getName())
                .displayName(resolveDisplayName(conv, members))   
                .otherUserId(otherUserId).otherUserEmail(otherEmail)
                .otherUserDisplayName(otherDisplayName)
                .lastMessage(lastMessage).unreadCount(unreadCount)
                .createdAt(conv.getCreatedAt().toLocalDateTime())
                .build();
    }

    // MD-2 FIX: m.getIsDeleted() is a Boolean wrapper — could NPE if Hibernate
    // returns null for an older row. Use Boolean.TRUE.equals() for null-safe check.
    private MessageResponse toMessageResponse(Message m) {
        boolean deleted = Boolean.TRUE.equals(m.getIsDeleted());
        String displayName = profileRepository.findByUserId(m.getSender().getId())
                .map(Profile::getDisplayName).orElse(null);

        return MessageResponse.builder()
                .id(m.getId())
                .conversationId(m.getConversation().getId())
                .senderId(m.getSender().getId())
                .senderEmail(m.getSender().getEmail())
                .senderDisplayName(displayName)
                .content(deleted ? null : m.getContent())
                .replyToId(m.getReplyTo() != null ? m.getReplyTo().getId() : null)
                .isDeleted(deleted)
                .sentAt(m.getSentAt())
                .editedAt(m.getEditedAt())
                .build();
    }
    private String resolveDisplayName(Conversation conv, List<ConversationMember> members) {
    if ("group".equals(conv.getType())) {
        String raw = conv.getName();
        // "grp:{uuid}" → look up study group name, or fall back to stripping prefix
        if (raw != null && raw.startsWith("grp:")) {
            try {
                UUID gid = UUID.fromString(raw.substring(4));
                return studyGroupRepository.findById(gid)
                        .map(g -> g.getName())
                        .orElse(raw);
            } catch (Exception e) {
                return raw;
            }
        }
        return raw;
    }
    return null; // DMs don't need this
}
}