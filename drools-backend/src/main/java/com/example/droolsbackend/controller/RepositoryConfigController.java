package com.example.droolsbackend.controller;

import com.example.droolsbackend.model.RepositoryConfig;
import com.example.droolsbackend.service.RepositoryConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/repository")
@CrossOrigin(origins = "*")
public class RepositoryConfigController {

    @Autowired
    private RepositoryConfigService repositoryConfigService;

    @PostMapping("/config")
    public ResponseEntity<Map<String, Object>> saveConfig(@RequestBody RepositoryConfig config) {
        try {
            if (config.getRepoUrl() == null || config.getRepoUrl().trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Repository URL is required");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            if (config.getBranch() == null || config.getBranch().trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Branch is required");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            repositoryConfigService.saveConfig(config);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Repository configuration saved successfully");
            response.put("config", repositoryConfigService.getConfig());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to save repository configuration: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @GetMapping("/config")
    public ResponseEntity<RepositoryConfig> getConfig() {
        try {
            RepositoryConfig config = repositoryConfigService.getConfig();
            if (config == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(config);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @DeleteMapping("/config")
    public ResponseEntity<Map<String, String>> clearConfig() {
        try {
            repositoryConfigService.clearConfig();
            Map<String, String> response = new HashMap<>();
            response.put("message", "Repository configuration cleared successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to clear repository configuration: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        try {
            Map<String, Object> response = new HashMap<>();
            response.put("isConfigured", repositoryConfigService.isConfigured());
            response.put("displayName", repositoryConfigService.getDisplayName());
            
            if (repositoryConfigService.isConfigured()) {
                response.put("repositoryPath", repositoryConfigService.getRepositoryPath());
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to get repository status: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
}
