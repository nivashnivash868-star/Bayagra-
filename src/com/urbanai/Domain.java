package com.urbanai;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

enum SourceType {
    WHATSAPP,
    SOCIAL
}

enum Category {
    ROADS,
    SANITATION,
    WATER,
    DRAINAGE,
    LIGHTING,
    TRAFFIC,
    GENERAL
}

enum Severity {
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL
}

enum Priority {
    LOW,
    NORMAL,
    HIGH,
    URGENT
}

enum IssueStatus {
    NEW,
    TRIAGED,
    UNDER_REVIEW,
    IN_PROGRESS,
    RESOLVED
}

final class ReportInput {
    String text;
    String imageUrl;
    SourceType source;
    String sourceHandle;
    String area;
    Double latitude;
    Double longitude;
    Instant reportedAt;
}

final class RawReport {
    long id;
    String text;
    String imageUrl;
    SourceType source;
    String sourceHandle;
    String area;
    Double latitude;
    Double longitude;
    Instant reportedAt;
}

final class Issue {
    long id;
    long rawReportId;
    SourceType source;
    String sourceHandle;
    String originalText;
    String translatedText;
    String detectedLanguage;
    String imageUrl;
    String area;
    Double latitude;
    Double longitude;
    Category category;
    Severity severity;
    Priority priority;
    String assignedDepartment;
    IssueStatus status;
    double classificationConfidence;
    double routingConfidence;
    boolean requiresHumanReview;
    String duplicateOf;
    String triageNotes;
    String triageEngine;
    Instant reportedAt;
    Instant updatedAt;
    List<OverrideRecord> overrides = new ArrayList<>();
}

final class OverrideRecord {
    Instant at;
    String reviewer;
    String field;
    String previousValue;
    String newValue;
    String note;
}

final class TranslationResult {
    String normalizedText;
    String detectedLanguage;
}

final class ClassificationResult {
    Category category;
    Severity severity;
    Priority priority;
    double confidence;
    String note;
}

final class RoutingResult {
    String department;
    double confidence;
}

final class Hotspot {
    String area;
    int totalIssues;
    String topCategory;
}

final class TrendSummary {
    List<Hotspot> hotspots = new ArrayList<>();
    List<String> recurringCategories = new ArrayList<>();
    List<String> anomalyNotes = new ArrayList<>();
}

final class TriageResult {
    TranslationResult translation;
    ClassificationResult classification;
    RoutingResult routing;
    String engine;
}

