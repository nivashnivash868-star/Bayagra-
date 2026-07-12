package com.urbanai;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class OpenAiTriageClient {
    private final String apiKey;
    private final String baseUrl;
    private final String model;
    private final HttpClient httpClient;

    public OpenAiTriageClient(String apiKey, String baseUrl, String model) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl == null || baseUrl.isBlank() ? "https://api.openai.com/v1" : baseUrl;
        this.model = model == null || model.isBlank() ? "gpt-5-mini-2025-08-07" : model;
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(20))
            .build();
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public TriageResult analyze(String text, String imageUrl, String area, DepartmentRegistry registry) throws IOException, InterruptedException {
        Map<String, Object> request = new LinkedHashMap<>();
        request.put("model", model);
        request.put("input", buildInput(text, imageUrl, area));

        Map<String, Object> reasoning = new LinkedHashMap<>();
        reasoning.put("effort", "low");
        request.put("reasoning", reasoning);

        HttpRequest httpRequest = HttpRequest.newBuilder()
            .uri(URI.create(baseUrl + "/responses"))
            .timeout(Duration.ofSeconds(45))
            .header("Authorization", "Bearer " + apiKey)
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(MiniJson.stringify(request)))
            .build();

        HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 300) {
            throw new IOException("OpenAI API error " + response.statusCode() + ": " + response.body());
        }

        Map<String, Object> payload = castObject(MiniJson.parse(response.body()));
        String outputText = extractOutputText(payload);
        Map<String, Object> aiJson = castObject(MiniJson.parse(outputText));
        return mapResult(aiJson, registry);
    }

    private List<Object> buildInput(String text, String imageUrl, String area) {
        String instructions = """
            You are an urban issue triage system for a municipal operations dashboard.
            Analyze the report and return only valid JSON with this exact shape:
            {
              "normalized_text": "translated or cleaned English text",
              "detected_language": "language label",
              "category": "ROADS|SANITATION|WATER|DRAINAGE|LIGHTING|TRAFFIC|GENERAL",
              "severity": "LOW|MEDIUM|HIGH|CRITICAL",
              "priority": "LOW|NORMAL|HIGH|URGENT",
              "assigned_department_hint": "one department name without area suffix",
              "classification_confidence": 0.0,
              "routing_confidence": 0.0,
              "notes": "short operational explanation"
            }
            Rules:
            - Translate non-English or mixed-language text into concise English.
            - Use the category taxonomy exactly as given.
            - Prefer CRITICAL and URGENT only for immediate safety, hospital, school, flooding, or major service disruption risks.
            - assigned_department_hint must be one of:
              Roads and Public Works
              Solid Waste Management
              Water Supply and Sewer Services
              Stormwater and Drainage
              Electrical Maintenance
              Traffic Operations
              Integrated City Command Center
            - Return JSON only. No markdown.
            """;

        StringBuilder userText = new StringBuilder();
        userText.append("Area: ").append(area == null || area.isBlank() ? "Unspecified" : area).append("\n");
        userText.append("Citizen report: ").append(text == null ? "" : text);

        List<Object> input = new ArrayList<>();
        Map<String, Object> developerMessage = new LinkedHashMap<>();
        developerMessage.put("role", "developer");
        developerMessage.put("content", List.of(Map.of("type", "input_text", "text", instructions)));
        input.add(developerMessage);

        List<Object> userContent = new ArrayList<>();
        userContent.add(Map.of("type", "input_text", "text", userText.toString()));
        if (imageUrl != null && !imageUrl.isBlank()) {
            userContent.add(Map.of("type", "input_image", "image_url", imageUrl));
        }
        Map<String, Object> userMessage = new LinkedHashMap<>();
        userMessage.put("role", "user");
        userMessage.put("content", userContent);
        input.add(userMessage);
        return input;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> castObject(Object value) {
        if (!(value instanceof Map<?, ?> map)) {
            throw new IllegalArgumentException("Expected JSON object");
        }
        return (Map<String, Object>) map;
    }

    @SuppressWarnings("unchecked")
    private static List<Object> castArray(Object value) {
        if (!(value instanceof List<?> list)) {
            throw new IllegalArgumentException("Expected JSON array");
        }
        return (List<Object>) list;
    }

    private static String extractOutputText(Map<String, Object> payload) {
        Object outputObject = payload.get("output");
        for (Object item : castArray(outputObject)) {
            Map<String, Object> outputItem = castObject(item);
            if (!"message".equals(outputItem.get("type"))) {
                continue;
            }
            for (Object contentItem : castArray(outputItem.get("content"))) {
                Map<String, Object> content = castObject(contentItem);
                if ("output_text".equals(content.get("type"))) {
                    return String.valueOf(content.get("text"));
                }
            }
        }
        throw new IllegalArgumentException("No output_text found in OpenAI response");
    }

    private static TriageResult mapResult(Map<String, Object> aiJson, DepartmentRegistry registry) {
        TriageResult result = new TriageResult();
        result.translation = new TranslationResult();
        result.translation.normalizedText = asString(aiJson.get("normalized_text"));
        result.translation.detectedLanguage = asString(aiJson.get("detected_language"));

        result.classification = new ClassificationResult();
        result.classification.category = parseCategory(asString(aiJson.get("category")));
        result.classification.severity = parseSeverity(asString(aiJson.get("severity")));
        result.classification.priority = parsePriority(asString(aiJson.get("priority")));
        result.classification.confidence = clamp(asDouble(aiJson.get("classification_confidence")), 0.0, 1.0);
        result.classification.note = asString(aiJson.get("notes"));

        result.routing = new RoutingResult();
        String departmentHint = asString(aiJson.get("assigned_department_hint"));
        if (departmentHint.isBlank()) {
            departmentHint = registry.resolve(result.classification.category, null);
        }
        result.routing.department = departmentHint;
        result.routing.confidence = clamp(asDouble(aiJson.get("routing_confidence")), 0.0, 1.0);
        result.engine = "openai:" + registry.resolve(result.classification.category, null);
        return result;
    }

    private static Category parseCategory(String raw) {
        try {
            return Category.valueOf(raw);
        } catch (Exception exception) {
            return Category.GENERAL;
        }
    }

    private static Severity parseSeverity(String raw) {
        try {
            return Severity.valueOf(raw);
        } catch (Exception exception) {
            return Severity.MEDIUM;
        }
    }

    private static Priority parsePriority(String raw) {
        try {
            return Priority.valueOf(raw);
        } catch (Exception exception) {
            return Priority.NORMAL;
        }
    }

    private static String asString(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    private static double asDouble(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (Exception exception) {
            return 0.0;
        }
    }

    private static double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }
}

