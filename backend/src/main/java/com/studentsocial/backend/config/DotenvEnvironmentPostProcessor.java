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
 * Loads key/value pairs from a .env file into the Spring Environment early during startup.
 * Supports a few locations (working dir, project root, classpath) so IDE run configurations
 * that change the working directory still pick up the file.
 */
public class DotenvEnvironmentPostProcessor implements EnvironmentPostProcessor {

    private static final String PROPERTY_SOURCE_NAME = "dotenvProperties";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        System.out.println("Looking for .env at: " + Paths.get(System.getProperty("user.dir"), ".env").toAbsolutePath());
        Map<String, Object> map = new HashMap<>();

        List<Path> candidates = new ArrayList<>();
        candidates.add(Paths.get(System.getProperty("user.dir"), ".env"));
        candidates.add(Paths.get("./.env"));

        for (Path p : candidates) {
            if (Files.exists(p)) {
                try (BufferedReader br = Files.newBufferedReader(p)) {
                    br.lines().forEach(line -> parseAndPut(line, map));
                } catch (IOException ignored) {
                }
            }
        }

        // try classpath resource .env as a fallback
        try (InputStream is = Thread.currentThread().getContextClassLoader().getResourceAsStream(".env")) {
            if (is != null) {
                try (BufferedReader br = new BufferedReader(new InputStreamReader(is))) {
                    br.lines().forEach(line -> parseAndPut(line, map));
                }
            }
        } catch (IOException ignored) {
        }

        if (!map.isEmpty()) {
            environment.getPropertySources().addFirst(new MapPropertySource(PROPERTY_SOURCE_NAME, map));
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
        if ((val.startsWith("\"") && val.endsWith("\"")) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.substring(1, val.length() - 1);
        }
        map.put(key, val);
    }

}
