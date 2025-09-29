package com.example.droolsbackend.service;

import org.springframework.stereotype.Service;

@Service
public class RepoConfigService {
    
    private RepoConfig currentConfig;
    
    public void setCurrentRepoConfig(RepoConfig config) {
        this.currentConfig = config;
    }
    
    public RepoConfig getCurrentRepoConfig() {
        return this.currentConfig;
    }
    
    public void clearConfig() {
        this.currentConfig = null;
    }
    
    public static class RepoConfig {
        private String repoUrl;
        private String branch;
        private String username;
        private String password;
        private String rulesFolder;
        
        public RepoConfig() {}
        
        public RepoConfig(String repoUrl, String branch, String username, String password, String rulesFolder) {
            this.repoUrl = repoUrl;
            this.branch = branch;
            this.username = username;
            this.password = password;
            this.rulesFolder = rulesFolder;
        }
        
        public String getRepoUrl() { return repoUrl; }
        public void setRepoUrl(String repoUrl) { this.repoUrl = repoUrl; }
        
        public String getBranch() { return branch; }
        public void setBranch(String branch) { this.branch = branch; }
        
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        
        public String getRulesFolder() { return rulesFolder; }
        public void setRulesFolder(String rulesFolder) { this.rulesFolder = rulesFolder; }
    }
}
