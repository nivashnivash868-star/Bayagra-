package com.urbanai;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public class StaticFileHandler implements HttpHandler {
    private final Path root;

    public StaticFileHandler(String rootFolder) {
        this.root = Path.of(rootFolder).toAbsolutePath().normalize();
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String requested = exchange.getRequestURI().getPath();
        if (requested.equals("/")) {
            requested = "/index.html";
        }
        Path file = root.resolve("." + requested).normalize();
        if (!file.startsWith(root) || !Files.exists(file) || Files.isDirectory(file)) {
            byte[] payload = "Not Found".getBytes();
            exchange.sendResponseHeaders(404, payload.length);
            exchange.getResponseBody().write(payload);
            exchange.close();
            return;
        }
        String name = file.getFileName().toString();
        String contentType;
        if (name.endsWith(".html")) {
            contentType = "text/html; charset=utf-8";
        } else if (name.endsWith(".css")) {
            contentType = "text/css; charset=utf-8";
        } else if (name.endsWith(".js")) {
            contentType = "application/javascript; charset=utf-8";
        } else {
            contentType = "application/octet-stream";
        }
        byte[] payload = Files.readAllBytes(file);
        exchange.getResponseHeaders().set("Content-Type", contentType);
        exchange.sendResponseHeaders(200, payload.length);
        exchange.getResponseBody().write(payload);
        exchange.close();
    }
}

