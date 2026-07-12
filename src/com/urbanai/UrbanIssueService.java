package com.urbanai;

import java.time.Instant;
import java.util.List;

public class UrbanIssueService {
    private final IssueRepository repository;
    private final TriageService triageService;

    public UrbanIssueService(IssueRepository repository, TriageService triageService) {
        this.repository = repository;
        this.triageService = triageService;
    }

    public Issue ingestReport(ReportInput input) {
        if (input.reportedAt == null) {
            input.reportedAt = Instant.now();
        }
        RawReport raw = repository.saveRawReport(input);
        TriageResult triage = triageService.triage(raw.text, raw.imageUrl, raw.area);

        Issue issue = new Issue();
        issue.rawReportId = raw.id;
        issue.source = raw.source;
        issue.sourceHandle = raw.sourceHandle;
        issue.originalText = raw.text;
        issue.translatedText = triage.translation.normalizedText;
        issue.detectedLanguage = triage.translation.detectedLanguage;
        issue.imageUrl = raw.imageUrl;
        issue.area = raw.area;
        issue.latitude = raw.latitude;
        issue.longitude = raw.longitude;
        issue.category = triage.classification.category;
        issue.severity = triage.classification.severity;
        issue.priority = triage.classification.priority;
        issue.assignedDepartment = triage.routing.department;
        issue.status = IssueStatus.TRIAGED;
        issue.classificationConfidence = triage.classification.confidence;
        issue.routingConfidence = triage.routing.confidence;
        issue.reportedAt = raw.reportedAt;
        issue.updatedAt = Instant.now();
        issue.triageEngine = triage.engine;
        issue.duplicateOf = triageService.findDuplicateText(issue.translatedText, repository.listIssues());
        issue.requiresHumanReview = issue.classificationConfidence < 0.7
            || issue.routingConfidence < 0.75
            || issue.area == null
            || issue.area.isBlank()
            || issue.severity == Severity.CRITICAL
            || issue.duplicateOf != null;
        issue.triageNotes = triage.classification.note;

        return repository.saveIssue(issue);
    }

    public List<Issue> listIssues() {
        return repository.listIssues();
    }

    public TrendSummary getTrendSummary() {
        return triageService.summarizeTrends(repository.listIssues());
    }

    public String currentAiMode() {
        return triageService.currentAiMode();
    }

    public Issue updateStatus(long issueId, IssueStatus status, String reviewer, String note) {
        Issue issue = repository.findIssue(issueId);
        if (issue == null) {
            return null;
        }
        OverrideRecord record = new OverrideRecord();
        record.at = Instant.now();
        record.reviewer = reviewer;
        record.field = "status";
        record.previousValue = issue.status.name();
        record.newValue = status.name();
        record.note = note;
        issue.overrides.add(record);
        issue.status = status;
        issue.updatedAt = Instant.now();
        repository.saveIssue(issue);
        return issue;
    }

    public Issue overrideIssue(long issueId, String reviewer, String category, String priority, String department, String note) {
        Issue issue = repository.findIssue(issueId);
        if (issue == null) {
            return null;
        }
        if (category != null && !category.isBlank()) {
            addOverride(issue, reviewer, "category", issue.category.name(), category, note);
            issue.category = Category.valueOf(category);
        }
        if (priority != null && !priority.isBlank()) {
            addOverride(issue, reviewer, "priority", issue.priority.name(), priority, note);
            issue.priority = Priority.valueOf(priority);
        }
        if (department != null && !department.isBlank()) {
            addOverride(issue, reviewer, "assignedDepartment", issue.assignedDepartment, department, note);
            issue.assignedDepartment = department;
        }
        issue.requiresHumanReview = false;
        issue.status = IssueStatus.UNDER_REVIEW;
        issue.updatedAt = Instant.now();
        repository.saveIssue(issue);
        return issue;
    }

    private void addOverride(Issue issue, String reviewer, String field, String previous, String next, String note) {
        OverrideRecord record = new OverrideRecord();
        record.at = Instant.now();
        record.reviewer = reviewer;
        record.field = field;
        record.previousValue = previous;
        record.newValue = next;
        record.note = note;
        issue.overrides.add(record);
    }

    public void seedDemoData() {
        ingest("Huge pothole near City Hospital main gate. Ambulances are slowing down badly.", SourceType.WHATSAPP, "Ward 4");
        ingest("Kachra overflowing near market lane since two days. Smell is terrible.", SourceType.WHATSAPP, "Ward 2");
        ingest("Street light not working on Lake Road and the whole corner is dark.", SourceType.SOCIAL, "Ward 5");
        ingest("Heavy rain caused drain blockage and waterlogging near bus stand.", SourceType.SOCIAL, "Ward 4");
        ingest("No water supply in East Colony from morning, pipe may be broken.", SourceType.WHATSAPP, "Ward 1");
    }

    private void ingest(String text, SourceType source, String area) {
        ReportInput input = new ReportInput();
        input.text = text;
        input.source = source;
        input.area = area;
        input.sourceHandle = source == SourceType.WHATSAPP ? "citizen" : "@citywatch";
        input.reportedAt = Instant.now().minusSeconds((long) (Math.random() * 50000));
        ingestReport(input);
    }
}

