package com.studentsocial.backend.util;

import java.util.HashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Utility for hashtag parsing, validation, and normalization.
 * 
 * Rules:
 * - Hashtags must be alphanumeric + underscore only (no special chars)
 * - Stored in lowercase
 * - Length: 1-50 characters
 * - Case-insensitive uniqueness enforced
 */
public class HashtagUtil {

    // Pattern: # followed by 1+ alphanumeric/underscore chars
    private static final Pattern HASHTAG_PATTERN = Pattern.compile("#([a-zA-Z0-9_]+)");
    private static final int MAX_TAG_LENGTH = 50;
    private static final int MAX_HASHTAGS_PER_POST = 30;

/**
 * Extract all unique hashtags from text, normalized and validated.
 * 
 * Supports space-separated hashtags with lenient parsing:
 *   - Accepts: "#tag1 #tag2", "#tag1  #tag2" (multiple spaces), "#tag1\n#tag2" (newlines)
 *   - User error tolerant: Any whitespace separation works
 *   - Max 30 hashtags per post, max 50 chars per tag
 * 
 * @param content The text to scan for hashtags
 * @return Set of normalized (lowercase, # removed) hashtag strings
 */
public static Set<String> extractHashtags(String content) {
    if (content == null || content.isEmpty()) {
        return new HashSet<>();
    }

    Set<String> hashtags = new HashSet<>();
    Matcher matcher = HASHTAG_PATTERN.matcher(content);

    while (matcher.find() && hashtags.size() < MAX_HASHTAGS_PER_POST) {
        String tag = matcher.group(1); // without the #
        String normalized = normalizeTag(tag);
        
        // Validate normalized tag
        if (isValidTag(normalized)) {
            hashtags.add(normalized);
        }
    }

    return hashtags;
}

    /**
     * Normalize a hashtag: lowercase, trim, validate length.
     * 
     * @param tag The tag to normalize (may include # or not)
     * @return Normalized tag or empty string if invalid
     */
    public static String normalizeTag(String tag) {
        if (tag == null) {
            return "";
        }

        // Remove leading # if present
        if (tag.startsWith("#")) {
            tag = tag.substring(1);
        }

        // Lowercase
        tag = tag.toLowerCase();

        // Trim whitespace
        tag = tag.trim();

        return tag;
    }

    /**
     * Validate a normalized hashtag.
     * 
     * @param tag The normalized tag (lowercase, no #)
     * @return true if valid, false otherwise
     */
    public static boolean isValidTag(String tag) {
        if (tag == null || tag.isEmpty()) {
            return false;
        }

        // Length check
        if (tag.length() > MAX_TAG_LENGTH) {
            return false;
        }

        // Alphanumeric + underscore only
        if (!tag.matches("^[a-z0-9_]+$")) {
            return false;
        }

        return true;
    }

    /**
     * Validate a user-provided hashtag string (may include #).
     * 
     * @param input User input
     * @return true if valid after normalization
     */
    public static boolean validate(String input) {
        String normalized = normalizeTag(input);
        return isValidTag(normalized);
    }

    /**
     * Get user-friendly error message for invalid hashtag.
     * 
     * @param tag The invalid tag
     * @return Error message
     */
    public static String getErrorMessage(String tag) {
        if (tag == null || tag.isEmpty()) {
            return "Hashtag cannot be empty";
        }

        tag = normalizeTag(tag);

        if (tag.length() > MAX_TAG_LENGTH) {
            return "Hashtag too long (max " + MAX_TAG_LENGTH + " chars)";
        }

        if (!tag.matches("^[a-z0-9_]+$")) {
            return "Hashtag can only contain letters, numbers, and underscores";
        }

        return "Invalid hashtag";
    }
}
