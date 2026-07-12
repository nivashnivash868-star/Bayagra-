package com.urbanai;

import java.text.Normalizer;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class HeuristicTriageEngine {
    private static final Map<String, String> TRANSLATION_HINTS = new LinkedHashMap<>();

    static {
        TRANSLATION_HINTS.put("gaddha", "pothole");
        TRANSLATION_HINTS.put("sadak", "road");
        TRANSLATION_HINTS.put("kachra", "garbage");
        TRANSLATION_HINTS.put("paani", "water");
        TRANSLATION_HINTS.put("thanni", "water");
        TRANSLATION_HINTS.put("light illa", "street light not working");
        TRANSLATION_HINTS.put("jam", "traffic jam");
        TRANSLATION_HINTS.put("naali", "drain");
        TRANSLATION_HINTS.put("baarish", "rain");
    }

    public TranslationResult translate(String text) {
        TranslationResult result = new TranslationResult();
        String normalized = normalizeText(text);
        String detected = "English";
        for (Map.Entry<String, String> entry : TRANSLATION_HINTS.entrySet()) {
            if (normalized.contains(entry.getKey())) {
                normalized = normalized.replace(entry.getKey(), entry.getValue());
                detected = "Mixed / Local Language";
            }
        }
        if (!text.chars().allMatch(c -> c < 128)) {
            detected = "Non-English Script";
        }
        result.normalizedText = normalized;
        result.detectedLanguage = detected;
        return result;
    }

    public ClassificationResult classify(String normalizedText, String imageUrl) {
        String text = normalizeText(normalizedText);
        ClassificationResult result = new ClassificationResult();
        result.category = Category.GENERAL;
        result.severity = Severity.MEDIUM;
        result.priority = Priority.NORMAL;
        result.confidence = 0.52;
        result.note = "Fallback general classification.";

        if (matchesAny(text, "pothole", "road broken", "road damage", "crater")) {
            result.category = Category.ROADS;
            result.severity = Severity.HIGH;
            result.priority = Priority.HIGH;
            result.confidence = 0.91;
            result.note = "Road damage keywords detected.";
        } else if (matchesAny(text, "garbage", "waste", "trash", "overflowing bin", "dump")) {
            result.category = Category.SANITATION;
            result.severity = Severity.MEDIUM;
            result.priority = Priority.NORMAL;
            result.confidence = 0.88;
            result.note = "Sanitation complaint keywords detected.";
        } else if (matchesAny(text, "water leak", "no water", "pipe burst", "sewage", "water supply")) {
            result.category = Category.WATER;
            result.severity = Severity.HIGH;
            result.priority = Priority.HIGH;
            result.confidence = 0.90;
            result.note = "Water and sewer service keywords detected.";
        } else if (matchesAny(text, "drain", "flood", "waterlogging", "stormwater")) {
            result.category = Category.DRAINAGE;
            result.severity = Severity.HIGH;
            result.priority = Priority.URGENT;
            result.confidence = 0.89;
            result.note = "Drainage or flooding pattern detected.";
        } else if (matchesAny(text, "street light", "dark", "lamp", "lighting")) {
            result.category = Category.LIGHTING;
            result.severity = Severity.MEDIUM;
            result.priority = Priority.NORMAL;
            result.confidence = 0.86;
            result.note = "Lighting outage pattern detected.";
        } else if (matchesAny(text, "traffic", "signal", "congestion", "jam", "accident")) {
            result.category = Category.TRAFFIC;
            result.severity = Severity.HIGH;
            result.priority = Priority.HIGH;
            result.confidence = 0.85;
            result.note = "Traffic disruption keywords detected.";
        }

        if (matchesAny(text, "school", "hospital", "ambulance", "children", "main road")) {
            result.severity = promoteSeverity(result.severity);
            result.priority = promotePriority(result.priority);
            result.note = result.note + " Sensitive-location signal increased urgency.";
        }
        if (imageUrl != null && !imageUrl.isBlank()) {
            result.confidence = Math.min(0.98, result.confidence + 0.03);
            result.note = result.note + " Photo evidence present.";
        }
        return result;
    }

    public TrendSummary summarizeTrends(List<Issue> issues) {
        TrendSummary summary = new TrendSummary();
        Map<String, Integer> areaCounts = new LinkedHashMap<>();
        Map<String, Map<Category, Integer>> areaCategoryCounts = new LinkedHashMap<>();
        Map<Category, Integer> categoryCounts = new LinkedHashMap<>();

        for (Issue issue : issues) {
            String area = issue.area == null || issue.area.isBlank() ? "Unspecified" : issue.area;
            areaCounts.merge(area, 1, Integer::sum);
            areaCategoryCounts.computeIfAbsent(area, ignored -> new LinkedHashMap<>())
                .merge(issue.category, 1, Integer::sum);
            categoryCounts.merge(issue.category, 1, Integer::sum);
        }

        areaCounts.entrySet().stream()
            .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
            .limit(5)
            .forEach(entry -> {
                Hotspot hotspot = new Hotspot();
                hotspot.area = entry.getKey();
                hotspot.totalIssues = entry.getValue();
                hotspot.topCategory = areaCategoryCounts.get(entry.getKey()).entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(item -> item.getKey().name())
                    .orElse(Category.GENERAL.name());
                summary.hotspots.add(hotspot);
            });

        categoryCounts.entrySet().stream()
            .sorted(Map.Entry.<Category, Integer>comparingByValue().reversed())
            .limit(3)
            .forEach(entry -> summary.recurringCategories.add(entry.getKey().name() + ": " + entry.getValue() + " reports"));

        for (Hotspot hotspot : summary.hotspots) {
            if (hotspot.totalIssues >= 3) {
                summary.anomalyNotes.add(hotspot.area + " shows a concentrated rise in " + hotspot.topCategory.toLowerCase(Locale.ROOT) + " issues.");
            }
        }
        if (summary.anomalyNotes.isEmpty()) {
            summary.anomalyNotes.add("No unusual spikes detected yet. Continue monitoring incoming reports.");
        }
        return summary;
    }

    public String findDuplicateText(String normalizedText, List<Issue> existingIssues) {
        String candidate = normalizeText(normalizedText);
        for (Issue issue : existingIssues) {
            String existing = normalizeText(issue.translatedText);
            if (existing.equals(candidate)) {
                return "Exact match with issue #" + issue.id;
            }
            if (sharedTokens(existing, candidate) >= 4) {
                return "Near-duplicate of issue #" + issue.id;
            }
        }
        return null;
    }

    public String normalizeText(String text) {
        return Normalizer.normalize(text == null ? "" : text, Normalizer.Form.NFKC)
            .toLowerCase(Locale.ROOT)
            .replaceAll("[^\\p{L}\\p{N}\\s]", " ")
            .replaceAll("\\s+", " ")
            .trim();
    }

    private static int sharedTokens(String left, String right) {
        List<String> leftTokens = List.of(left.split("\\s+"));
        List<String> rightTokens = List.of(right.split("\\s+"));
        int matches = 0;
        for (String token : leftTokens) {
            if (token.length() > 3 && rightTokens.contains(token)) {
                matches++;
            }
        }
        return matches;
    }

    private static boolean matchesAny(String text, String... options) {
        for (String option : options) {
            if (text.contains(option)) {
                return true;
            }
        }
        return false;
    }

    private static Severity promoteSeverity(Severity severity) {
        return switch (severity) {
            case LOW -> Severity.MEDIUM;
            case MEDIUM -> Severity.HIGH;
            case HIGH, CRITICAL -> Severity.CRITICAL;
        };
    }

    private static Priority promotePriority(Priority priority) {
        return switch (priority) {
            case LOW -> Priority.NORMAL;
            case NORMAL -> Priority.HIGH;
            case HIGH, URGENT -> Priority.URGENT;
        };
    }
}

