package com.example.droolsbackend.controller;

import com.example.droolsbackend.service.GitService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/git")
@CrossOrigin(origins = "*")
public class GitController {

    @Autowired
    private GitService gitService;

    @PostMapping("/pull")
    public ResponseEntity<Map<String, String>> pullFromRepo(@RequestBody Map<String, String> request) {
        try {
            String repoUrl = request.get("repoUrl");
            String branch = request.get("branch");
            
            if (repoUrl == null || branch == null) {
                return ResponseEntity.badRequest().build();
            }
            
            gitService.pullFromRepo(repoUrl, branch);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Pull completed successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Git pull failed: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @PostMapping("/generate-branch-name")
    public ResponseEntity<Map<String, String>> generateBranchName(@RequestBody Map<String, String> request) {
        try {
            String fileName = request.get("fileName");
            String repoUrl = request.get("repoUrl");
            
            if (fileName == null || repoUrl == null) {
                return ResponseEntity.badRequest().build();
            }
            
            String branchName = gitService.generateBranchName(fileName, repoUrl);
            Map<String, String> response = new HashMap<>();
            response.put("branchName", branchName);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Branch name generation failed: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @PostMapping("/push")
    public ResponseEntity<Map<String, String>> pushToRepo(@RequestBody Map<String, String> request) {
        try {
            String fileName = request.get("fileName");
            String repoUrl = request.get("repoUrl");
            String newBranch = request.get("newBranch");
            String commitMessage = request.get("commitMessage");
            
            if (fileName == null || repoUrl == null || newBranch == null || commitMessage == null) {
                return ResponseEntity.badRequest().build();
            }
            
            String actualBranchName = gitService.pushToRepo(fileName, repoUrl, newBranch, commitMessage);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Push completed successfully");
            response.put("branchName", actualBranchName);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Git push failed: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @PostMapping("/pr")
    public ResponseEntity<Map<String, String>> createPullRequest(@RequestBody Map<String, String> request) {
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
            Map<String, String> response = new HashMap<>();
            response.put("message", "Pull request created successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Pull request creation failed: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @PostMapping("/branches")
    public ResponseEntity<List<Map<String, Object>>> listRemoteBranches(@RequestBody Map<String, String> request) {
        try {
            String repoUrl = request.get("repoUrl");
            
            if (repoUrl == null || repoUrl.trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            
            List<Map<String, Object>> branches = gitService.listRemoteBranches(repoUrl);
            return ResponseEntity.ok(branches);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }
}
