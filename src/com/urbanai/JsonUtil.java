package com.urbanai;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.Map;

public class JsonUtil {
    public static void sendJson(HttpExchange exchange, int statusCode, String json) throws IOException {
        byte[] payload = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        exchange.sendResponseHeaders(statusCode, payload.length);
        exchange.getResponseBody().write(payload);
        exchange.close();
    }

    public static String issuesJson(Collection<Issue> issues) {
        return toJson(Map.of("issues", issues));
    }

    public static String issueJson(Issue issue) {
        return toJson(issue);
    }

    public static String trendsJson(TrendSummary summary) {
        return toJson(summary);
    }

    public static String toJson(Object value) {
        if (value == null) {
            return "null";
        }
        if (value instanceof String string) {
            return "\"" + escape(string) + "\"";
        }
        if (value instanceof Number || value instanceof Boolean) {
            return String.valueOf(value);
        }
        if (value instanceof Enum<?> enumeration) {
            return toJson(enumeration.name());
        }
        if (value instanceof Instant instant) {
            return toJson(instant.toString());
        }
        if (value instanceof Map<?, ?> map) {
            StringBuilder builder = new StringBuilder("{");
            boolean first = true;
            for (Map.Entry<?, ?> entry : map.entrySet()) {
                if (!first) {
                    builder.append(',');
                }
                first = false;
                builder.append(toJson(String.valueOf(entry.getKey()))).append(':').append(toJson(entry.getValue()));
            }
            return builder.append('}').toString();
        }
        if (value instanceof Collection<?> collection) {
            StringBuilder builder = new StringBuilder("[");
            boolean first = true;
            for (Object item : collection) {
                if (!first) {
                    builder.append(',');
                }
                first = false;
                builder.append(toJson(item));
            }
            return builder.append(']').toString();
        }
        if (value instanceof Issue issue) {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("id", issue.id);
            payload.put("rawReportId", issue.rawReportId);
            payload.put("source", issue.source);
            payload.put("sourceHandle", safe(issue.sourceHandle));
            payload.put("originalText", safe(issue.originalText));
            payload.put("translatedText", safe(issue.translatedText));
            payload.put("detectedLanguage", safe(issue.detectedLanguage));
            payload.put("imageUrl", safe(issue.imageUrl));
            payload.put("area", safe(issue.area));
            payload.put("latitude", issue.latitude);
            payload.put("longitude", issue.longitude);
            payload.put("category", issue.category);
            payload.put("severity", issue.severity);
            payload.put("priority", issue.priority);
            payload.put("assignedDepartment", safe(issue.assignedDepartment));
            payload.put("status", issue.status);
            payload.put("classificationConfidence", issue.classificationConfidence);
            payload.put("routingConfidence", issue.routingConfidence);
            payload.put("requiresHumanReview", issue.requiresHumanReview);
            payload.put("duplicateOf", issue.duplicateOf);
            payload.put("triageNotes", safe(issue.triageNotes));
            payload.put("triageEngine", safe(issue.triageEngine));
            payload.put("reportedAt", issue.reportedAt);
            payload.put("updatedAt", issue.updatedAt);
            payload.put("overrides", issue.overrides);
            return toJson(payload);
        }
        if (value instanceof OverrideRecord override) {
            return toJson(Map.of(
                "at", override.at,
                "reviewer", safe(override.reviewer),
                "field", safe(override.field),
                "previousValue", safe(override.previousValue),
                "newValue", safe(override.newValue),
                "note", safe(override.note)
            ));
        }
        if (value instanceof TrendSummary summary) {
            return toJson(Map.of(
                "hotspots", summary.hotspots,
                "recurringCategories", summary.recurringCategories,
                "anomalyNotes", summary.anomalyNotes
            ));
        }
        if (value instanceof Hotspot hotspot) {
            return toJson(Map.of(
                "area", safe(hotspot.area),
                "totalIssues", hotspot.totalIssues,
                "topCategory", safe(hotspot.topCategory)
            ));
        }
        return toJson(String.valueOf(value));
    }

    private static String safe(String value) {
        return value == null ? "" : value;
    }

    private static String escape(String text) {
        return text
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\r", "\\r");
    }
}

