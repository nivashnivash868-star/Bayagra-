package com.urbanai;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

public class IssueRepository {
    private final AtomicLong rawReportIds = new AtomicLong(1);
    private final AtomicLong issueIds = new AtomicLong(1);
    private final Map<Long, RawReport> rawReports = new LinkedHashMap<>();
    private final Map<Long, Issue> issues = new LinkedHashMap<>();

    public synchronized RawReport saveRawReport(ReportInput input) {
        RawReport raw = new RawReport();
        raw.id = rawReportIds.getAndIncrement();
        raw.text = input.text;
        raw.imageUrl = input.imageUrl;
        raw.source = input.source;
        raw.sourceHandle = input.sourceHandle;
        raw.area = input.area;
        raw.latitude = input.latitude;
        raw.longitude = input.longitude;
        raw.reportedAt = input.reportedAt;
        rawReports.put(raw.id, raw);
        return raw;
    }

    public synchronized Issue saveIssue(Issue issue) {
        if (issue.id == 0) {
            issue.id = issueIds.getAndIncrement();
        }
        issues.put(issue.id, issue);
        return issue;
    }

    public synchronized List<Issue> listIssues() {
        return issues.values().stream()
            .sorted(Comparator.comparing((Issue item) -> item.reportedAt).reversed())
            .toList();
    }

    public synchronized Issue findIssue(long id) {
        return issues.get(id);
    }

    public synchronized List<RawReport> listRawReports() {
        return new ArrayList<>(rawReports.values());
    }
}

