package com.example.droolsbackend.service;

import org.springframework.stereotype.Service;

@Service
public class RepositoryConfigService {
    
    private static final String BASE_REPO_DIR = "/home/ubuntu/repos/";
    private String currentRepoUrl;
    private String currentBranch;
    private String currentUsername;
    private String currentPassword;
    
    public void configure(String repoUrl, String branch, String username, String password) {
        this.currentRepoUrl = repoUrl;
        this.currentBranch = branch;
        this.currentUsername = username;
        this.currentPassword = password;
    }
    
    public boolean isConfigured() {
        return currentRepoUrl != null && !currentRepoUrl.isEmpty();
    }
    
    public String getRepositoryPath() {
        if (!isConfigured()) {
            return null;
        }
        
        String repoName = extractRepoName(currentRepoUrl);
        return BASE_REPO_DIR + repoName;
    }
    
    public String getCurrentRepoUrl() {
        return currentRepoUrl;
    }
    
    public String getCurrentBranch() {
        return currentBranch != null ? currentBranch : "main";
    }
    
    public String getCurrentUsername() {
        return currentUsername;
    }
    
    public String getCurrentPassword() {
        return currentPassword;
    }
    
    private String extractRepoName(String repoUrl) {
        String repoName = repoUrl.substring(repoUrl.lastIndexOf('/') + 1);
        if (repoName.endsWith(".git")) {
            repoName = repoName.substring(0, repoName.length() - 4);
        }
        return repoName;
    }
    
    public void clearConfiguration() {
        this.currentRepoUrl = null;
        this.currentBranch = null;
        this.currentUsername = null;
        this.currentPassword = null;
    }
}
