package com.example.droolsbackend.controller;

import com.example.droolsbackend.service.GitService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.HashMap;
import java.util.List;

@RestController
@RequestMapping("/api/git")
@CrossOrigin(origins = "*")
public class GitController {

    @Autowired
    private GitService gitService;

    @PostMapping("/pull")
    public ResponseEntity<String> pullFromRepo(@RequestBody Map<String, String> request) {
        try {
            String repoUrl = request.get("repoUrl");
            String branch = request.get("branch");
            
            if (repoUrl == null || branch == null) {
                return ResponseEntity.badRequest().build();
            }
            
            gitService.pullFromRepo(repoUrl, branch);
            return ResponseEntity.ok("Pull completed successfully");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/push")
    public ResponseEntity<String> pushToRepo(@RequestBody Map<String, String> request) {
        try {
            String fileName = request.get("fileName");
            String repoUrl = request.get("repoUrl");
            String newBranch = request.get("newBranch");
            String commitMessage = request.get("commitMessage");
            
            if (fileName == null || repoUrl == null || newBranch == null || commitMessage == null) {
                return ResponseEntity.badRequest().build();
            }
            
            gitService.pushToRepo(fileName, repoUrl, newBranch, commitMessage);
            return ResponseEntity.ok("Push completed successfully");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/pr")
    public ResponseEntity<String> createPullRequest(@RequestBody Map<String, String> request) {
        try {
            String repoUrl = request.get("repoUrl");
            String baseBranch = request.get("baseBranch");
            String newBranch = request.get("newBranch");
            String title = request.get("title");
            String body = request.get("body");
            
            if (repoUrl == null || baseBranch == null || newBranch == null || title == null) {
                return ResponseEntity.badRequest().build();
            }
            
            gitService.createPullRequest(repoUrl, baseBranch, newBranch, title, body);
            return ResponseEntity.ok("Pull request created successfully");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateRepository(@RequestBody Map<String, String> request) {
        try {
            String repoUrl = request.get("repoUrl");
            String username = request.get("username");
            String password = request.get("password");
            
            if (repoUrl == null) {
                return ResponseEntity.badRequest().build();
            }
            
            boolean isValid = gitService.validateRepositoryUrl(repoUrl, username, password);
            
            Map<String, Object> response = new HashMap<>();
            response.put("isValid", isValid);
            response.put("message", isValid ? "Repository URL is valid" : "Repository URL is invalid or inaccessible");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> response = new HashMap<>();
            response.put("isValid", false);
            response.put("message", "Validation failed: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }

    @PostMapping("/test-connection")
    public ResponseEntity<Map<String, Object>> testConnection(@RequestBody Map<String, String> request) {
        try {
            String repoUrl = request.get("repoUrl");
            String branch = request.get("branch");
            String username = request.get("username");
            String password = request.get("password");
            
            if (repoUrl == null) {
                return ResponseEntity.badRequest().build();
            }
            
            boolean isConnected = gitService.testRepositoryConnection(repoUrl, branch, username, password);
            
            Map<String, Object> response = new HashMap<>();
            response.put("isConnected", isConnected);
            response.put("message", isConnected ? 
                "Successfully connected to repository" : 
                "Failed to connect to repository or branch not found");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> response = new HashMap<>();
            response.put("isConnected", false);
            response.put("message", "Connection test failed: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }

    @PostMapping("/detect-folders")
    public ResponseEntity<Map<String, Object>> detectFolders(@RequestBody Map<String, String> request) {
        try {
            String repoUrl = request.get("repoUrl");
            String branch = request.get("branch");
            String username = request.get("username");
            String password = request.get("password");
            
            if (repoUrl == null) {
                return ResponseEntity.badRequest().build();
            }
            
            List<String> folders = gitService.detectRulesFolders(repoUrl, branch, username, password);
            
            Map<String, Object> response = new HashMap<>();
            response.put("folders", folders);
            response.put("message", folders.isEmpty() ? 
                "No folders with Excel files found" : 
                "Found " + folders.size() + " folder(s) with Excel files");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> response = new HashMap<>();
            response.put("folders", new ArrayList<>());
            response.put("message", "Folder detection failed: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
}
