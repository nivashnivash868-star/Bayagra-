package com.urbanai;

import java.util.List;

public class TriageService {
    private final DepartmentRegistry departmentRegistry;
    private final HeuristicTriageEngine heuristicEngine;
    private final OpenAiTriageClient openAiClient;

    public TriageService(DepartmentRegistry departmentRegistry) {
        this.departmentRegistry = departmentRegistry;
        this.heuristicEngine = new HeuristicTriageEngine();
        this.openAiClient = new OpenAiTriageClient(
            System.getenv("OPENAI_API_KEY"),
            System.getenv("OPENAI_BASE_URL"),
            System.getenv("OPENAI_MODEL")
        );
    }

    public TriageResult triage(String text, String imageUrl, String area) {
        if (openAiClient.isConfigured()) {
            try {
                TriageResult result = openAiClient.analyze(text, imageUrl, area, departmentRegistry);
                if (result.translation.normalizedText == null || result.translation.normalizedText.isBlank()) {
                    result.translation.normalizedText = heuristicEngine.normalizeText(text);
                }
                if (result.routing.department == null || result.routing.department.isBlank()) {
                    result.routing.department = departmentRegistry.resolve(result.classification.category, area);
                } else if (area != null && !area.isBlank() && !result.routing.department.contains(area)) {
                    result.routing.department = result.routing.department + " - " + area;
                }
                result.engine = "OpenAI";
                return result;
            } catch (Exception exception) {
                TriageResult fallback = triageHeuristically(text, imageUrl, area);
                fallback.classification.note = "OpenAI unavailable; using heuristic fallback. " + fallback.classification.note;
                fallback.engine = "Fallback";
                return fallback;
            }
        }
        return triageHeuristically(text, imageUrl, area);
    }

    public TrendSummary summarizeTrends(List<Issue> issues) {
        return heuristicEngine.summarizeTrends(issues);
    }

    public String findDuplicateText(String normalizedText, List<Issue> existingIssues) {
        return heuristicEngine.findDuplicateText(normalizedText, existingIssues);
    }

    public String currentAiMode() {
        return openAiClient.isConfigured() ? "OpenAI" : "Heuristic fallback";
    }

    private TriageResult triageHeuristically(String text, String imageUrl, String area) {
        TriageResult result = new TriageResult();
        result.translation = heuristicEngine.translate(text);
        result.classification = heuristicEngine.classify(result.translation.normalizedText, imageUrl);
        result.routing = new RoutingResult();
        result.routing.department = departmentRegistry.resolve(result.classification.category, area);
        result.routing.confidence = area == null || area.isBlank() ? 0.6 : 0.92;
        result.engine = "Heuristic";
        return result;
    }
}

