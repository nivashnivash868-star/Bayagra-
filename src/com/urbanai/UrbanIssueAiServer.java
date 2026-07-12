package com.urbanai;

import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.concurrent.Executors;

public class UrbanIssueAiServer {
    public static void main(String[] args) throws IOException {
        int port = Integer.parseInt(System.getenv().getOrDefault("PORT", "8080"));

        IssueRepository repository = new IssueRepository();
        DepartmentRegistry departmentRegistry = DepartmentRegistry.defaultRegistry();
        TriageService triageService = new TriageService(departmentRegistry);
        UrbanIssueService urbanIssueService = new UrbanIssueService(repository, triageService);
        urbanIssueService.seedDemoData();

        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        ApiController apiController = new ApiController(urbanIssueService, departmentRegistry);
        StaticFileHandler staticFileHandler = new StaticFileHandler("static");

        server.createContext("/api/issues", apiController::handleIssues);
        server.createContext("/api/reports", apiController::handleReports);
        server.createContext("/api/trends", apiController::handleTrends);
        server.createContext("/api/departments", apiController::handleDepartments);
        server.createContext("/", staticFileHandler);
        server.setExecutor(Executors.newFixedThreadPool(8));
        server.start();

        System.out.println("Urban Issue AI server running at http://localhost:" + port);
    }
}
