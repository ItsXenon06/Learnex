package com.studentsocial.backend.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Loads .env from several candidate locations so the app works whether
 * run from the repo root, from backend/, or from an IDE with a custom
 * working directory.
 *
 * Priority (first file found wins):
 *   1. {cwd}/.env               e.g. backend/.env  when run with mvn spring-boot:run
 *   2. {cwd}/../.env             e.g. root .env     when cwd is backend/
 *   3. classpath .env            fallback for packaged JARs
 */
public class DotenvEnvironmentPostProcessor implements EnvironmentPostProcessor {

    private static final String SOURCE_NAME = "dotenvProperties";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment,
                                       SpringApplication application) {
        Map<String, Object> map = new HashMap<>();

        List<Path> candidates = new ArrayList<>();
        String cwd = System.getProperty("user.dir");
        candidates.add(Paths.get(cwd, ".env"));
        candidates.add(Paths.get(cwd, "..", ".env").normalize());

        for (Path p : candidates) {
            if (Files.exists(p)) {
                try (BufferedReader br = Files.newBufferedReader(p)) {
                    br.lines().forEach(line -> parseAndPut(line, map));
                } catch (IOException ignored) {}
                break; // first match wins
            }
        }

        // Classpath fallback
        if (map.isEmpty()) {
            try (InputStream is = Thread.currentThread()
                    .getContextClassLoader().getResourceAsStream(".env")) {
                if (is != null) {
                    try (BufferedReader br = new BufferedReader(new InputStreamReader(is))) {
                        br.lines().forEach(line -> parseAndPut(line, map));
                    }
                }
            } catch (IOException ignored) {}
        }

        if (!map.isEmpty()) {
            environment.getPropertySources()
                    .addFirst(new MapPropertySource(SOURCE_NAME, map));
        }
    }

    private void parseAndPut(String raw, Map<String, Object> map) {
        if (raw == null) return;
        String line = raw.trim();
        if (line.isEmpty() || line.startsWith("#")) return;
        int idx = line.indexOf('=');
        if (idx <= 0) return;
        String key = line.substring(0, idx).trim();
        String val = line.substring(idx + 1).trim();
        // Strip surrounding quotes
        if (val.length() >= 2 &&
            ((val.startsWith("\"") && val.endsWith("\"")) ||
             (val.startsWith("'")  && val.endsWith("'")))) {
            val = val.substring(1, val.length() - 1);
        }
        map.put(key, val);
    }
}