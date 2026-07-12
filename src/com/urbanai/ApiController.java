package com.urbanai;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class ApiController {
    private final UrbanIssueService urbanIssueService;
    private final DepartmentRegistry departmentRegistry;

    public ApiController(UrbanIssueService urbanIssueService, DepartmentRegistry departmentRegistry) {
        this.urbanIssueService = urbanIssueService;
        this.departmentRegistry = departmentRegistry;
    }

    public void handleIssues(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        if ("GET".equals(exchange.getRequestMethod()) && "/api/issues".equals(path)) {
            JsonUtil.sendJson(exchange, 200, JsonUtil.issuesJson(urbanIssueService.listIssues()));
            return;
        }
        if ("POST".equals(exchange.getRequestMethod()) && path.matches("/api/issues/\\d+/status")) {
            Map<String, String> form = FormUtil.parse(exchange);
            long id = parseIssueId(path);
            Issue issue = urbanIssueService.updateStatus(
                id,
                IssueStatus.valueOf(form.getOrDefault("status", "UNDER_REVIEW")),
                form.getOrDefault("reviewer", "operations"),
                form.getOrDefault("note", "")
            );
            if (issue == null) {
                JsonUtil.sendJson(exchange, 404, "{\"error\":\"Issue not found\"}");
                return;
            }
            JsonUtil.sendJson(exchange, 200, JsonUtil.issueJson(issue));
            return;
        }
        if ("POST".equals(exchange.getRequestMethod()) && path.matches("/api/issues/\\d+/override")) {
            Map<String, String> form = FormUtil.parse(exchange);
            long id = parseIssueId(path);
            Issue issue = urbanIssueService.overrideIssue(
                id,
                form.getOrDefault("reviewer", "operations"),
                form.get("category"),
                form.get("priority"),
                form.get("department"),
                form.getOrDefault("note", "")
            );
            if (issue == null) {
                JsonUtil.sendJson(exchange, 404, "{\"error\":\"Issue not found\"}");
                return;
            }
            JsonUtil.sendJson(exchange, 200, JsonUtil.issueJson(issue));
            return;
        }
        JsonUtil.sendJson(exchange, 404, "{\"error\":\"Unsupported issues endpoint\"}");
    }

    public void handleReports(HttpExchange exchange) throws IOException {
        if (!"POST".equals(exchange.getRequestMethod())) {
            JsonUtil.sendJson(exchange, 405, "{\"error\":\"Use POST\"}");
            return;
        }
        Map<String, String> form = FormUtil.parse(exchange);
        ReportInput input = new ReportInput();
        input.text = form.getOrDefault("text", "");
        input.imageUrl = form.getOrDefault("imageUrl", "");
        input.source = SourceType.valueOf(form.getOrDefault("source", "WHATSAPP"));
        input.sourceHandle = form.getOrDefault("sourceHandle", "anonymous");
        input.area = form.getOrDefault("area", "");
        input.latitude = parseDouble(form.get("latitude"));
        input.longitude = parseDouble(form.get("longitude"));
        input.reportedAt = Instant.now();

        if (input.text.isBlank()) {
            JsonUtil.sendJson(exchange, 400, "{\"error\":\"text is required\"}");
            return;
        }

        Issue issue = urbanIssueService.ingestReport(input);
        JsonUtil.sendJson(exchange, 201, JsonUtil.issueJson(issue));
    }

    public void handleTrends(HttpExchange exchange) throws IOException {
        if (!"GET".equals(exchange.getRequestMethod())) {
            JsonUtil.sendJson(exchange, 405, "{\"error\":\"Use GET\"}");
            return;
        }
        JsonUtil.sendJson(exchange, 200, JsonUtil.trendsJson(urbanIssueService.getTrendSummary()));
    }

    public void handleDepartments(HttpExchange exchange) throws IOException {
        if (!"GET".equals(exchange.getRequestMethod())) {
            JsonUtil.sendJson(exchange, 405, "{\"error\":\"Use GET\"}");
            return;
        }
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("departments", departmentRegistry.listDepartments());
        payload.put("categories", List.of(Category.values()).stream().map(Enum::name).toList());
        payload.put("priorities", List.of(Priority.values()).stream().map(Enum::name).toList());
        payload.put("statuses", List.of(IssueStatus.values()).stream().map(Enum::name).toList());
        payload.put("aiMode", urbanIssueService.currentAiMode());
        JsonUtil.sendJson(exchange, 200, JsonUtil.toJson(payload));
    }

    private static long parseIssueId(String path) {
        String[] segments = path.split("/");
        return Long.parseLong(segments[3]);
    }

    private static Double parseDouble(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Double.parseDouble(value);
        } catch (NumberFormatException exception) {
            return null;
        }
    }
}

