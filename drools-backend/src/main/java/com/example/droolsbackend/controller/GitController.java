package com.example.droolsbackend.controller;

import com.example.droolsbackend.service.GitService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

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
}
