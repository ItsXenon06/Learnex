package com.studentsocial.backend.util;

import com.studentsocial.backend.dto.response.GroupedNotificationResponse;
import com.studentsocial.backend.model.Notification;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Utility for grouping notifications intelligently.
 * 
 * Grouping rules:
 * - FOLLOWS: Group all "follow" notifications (no resource association needed)
 *   Summary: "Alice and 2 others followed you"
 * 
 * - LIKES: Group by postId — multiple likes on same post combined
 *   Summary: "Alice and 3 others liked your post"
 * 
 * - COMMENTS: Keep individual (important feedback, but can show count in summary)
 * 
 * - MESSAGES: Group by conversationId
 *   Summary: "You have 5 new messages in [conversation]"
 * 
 * - OTHER: Keep individual
 */
public class NotificationGroupingUtil {

    private static final int MAX_ACTOR_NAMES = 3;

    /**
     * Group notifications by smart rules.
     * Returns grouped notifications sorted by latest timestamp.
     */
    public static List<GroupedNotificationResponse> group(List<Notification> notifications) {
        if (notifications == null || notifications.isEmpty()) {
            return Collections.emptyList();
        }

        Map<String, List<Notification>> groups = new HashMap<>();

        for (Notification n : notifications) {
            String groupKey = getGroupKey(n);
            groups.computeIfAbsent(groupKey, k -> new ArrayList<>()).add(n);
        }

        return groups.values().stream()
                .map(NotificationGroupingUtil::buildGroupedResponse)
                .sorted((a, b) -> b.getLatestCreatedAt().compareTo(a.getLatestCreatedAt()))
                .collect(Collectors.toList());
    }

    /**
     * Determine the grouping key for a notification.
     * Same key = notifications can be grouped together.
     */
    private static String getGroupKey(Notification n) {
        String type = n.getType();
        Map<String, Object> payload = n.getPayloadJson() != null ? n.getPayloadJson() : new HashMap<>();

        return switch (type) {
            case "follow" -> "follow"; // All follows grouped together
            case "like" -> {
                Object postId = payload.get("postId");
                yield "like_post_" + (postId != null ? postId : "unknown");
            }
            case "comment" -> "individual_" + n.getId(); // Keep individual
            case "message" -> {
                Object convId = payload.get("conversationId");
                yield "message_conv_" + (convId != null ? convId : "unknown");
            }
            case "mention" -> "individual_" + n.getId();
            default -> "individual_" + n.getId();
        };
    }

    /**
     * Build a grouped response from a list of notifications.
     */
    private static GroupedNotificationResponse buildGroupedResponse(List<Notification> grouped) {
        if (grouped.isEmpty()) {
            return null;
        }

        Notification latest = grouped.get(0);
        Notification first = grouped.get(grouped.size() - 1);
        String type = latest.getType();
        int count = grouped.size();

        // Extract unique actor names
        Set<String> uniqueActors = new LinkedHashSet<>();
        for (Notification n : grouped) {
            Object actorName = n.getPayloadJson() != null ? n.getPayloadJson().get("actorName") : null;
            if (actorName != null) {
                uniqueActors.add(actorName.toString());
            }
        }

        List<String> actorNames = new ArrayList<>(uniqueActors);
        String actorSummary = buildActorSummary(actorNames);

        String summary = buildSummary(type, count, actorSummary);

        // Use latest notification's payload as the primary payload
        Map<String, Object> payload = latest.getPayloadJson() != null 
            ? new HashMap<>(latest.getPayloadJson()) 
            : new HashMap<>();

        GroupedNotificationResponse response = GroupedNotificationResponse.builder()
                .id(latest.getId())
                .type(type)
                .isRead(latest.isRead())
                .count(count)
                .actorNames(limitActorNames(actorNames))
                .summary(summary)
                .payloadJson(payload)
                .latestCreatedAt(latest.getCreatedAt())
                .firstCreatedAt(first.getCreatedAt())
                .relatedPostId(extractUUID(payload.get("postId")))
                .relatedConversationId(extractUUID(payload.get("conversationId")))
                .build();

        return response;
    }

    /**
     * Build actor summary: "Alice and 2 others" or "Alice and Bob"
     */
    private static String buildActorSummary(List<String> actorNames) {
        if (actorNames.isEmpty()) {
            return "Someone";
        }
        if (actorNames.size() == 1) {
            return actorNames.get(0);
        }
        if (actorNames.size() == 2) {
            return actorNames.get(0) + " and " + actorNames.get(1);
        }
        int extra = actorNames.size() - 1;
        return actorNames.get(0) + " and " + extra + (extra == 1 ? " other" : " others");
    }

    /**
     * Limit actor names to first MAX_ACTOR_NAMES for display
     */
    private static List<String> limitActorNames(List<String> actorNames) {
        if (actorNames.size() <= MAX_ACTOR_NAMES) {
            return actorNames;
        }
        return actorNames.subList(0, MAX_ACTOR_NAMES);
    }

    /**
     * Build human-readable summary based on notification type and count
     */
    private static String buildSummary(String type, int count, String actorSummary) {
        return switch (type) {
            case "follow" -> count == 1 
                ? actorSummary + " followed you"
                : actorSummary + " followed you";
            case "like" -> count == 1
                ? actorSummary + " liked your post"
                : actorSummary + " and " + (count - 1) + " " + (count == 2 ? "other" : "others") + " liked your post";
            case "comment" -> count == 1
                ? actorSummary + " commented on your post"
                : actorSummary + " and " + (count - 1) + " " + (count == 2 ? "other" : "others") + " commented";
            case "message" -> count == 1
                ? "You have a new message from " + actorSummary
                : "You have " + count + " new messages";
            case "mention" -> count == 1
                ? actorSummary + " mentioned you"
                : actorSummary + " and " + (count - 1) + " " + (count == 2 ? "other" : "others") + " mentioned you";
            default -> "You have " + count + " new " + type + (count == 1 ? "" : "s");
        };
    }

    /**
     * Extract UUID from Object (handles String or UUID)
     */
    private static UUID extractUUID(Object obj) {
        if (obj == null) return null;
        if (obj instanceof UUID uuid) return uuid;
        if (obj instanceof String str) {
            try {
                return UUID.fromString(str);
            } catch (IllegalArgumentException e) {
                return null;
            }
        }
        return null;
    }
}
