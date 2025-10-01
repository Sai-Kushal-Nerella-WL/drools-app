package com.example.droolsbackend.service;

import com.example.droolsbackend.model.RepositoryConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;

@Service
public class RepositoryConfigService {
    
    private RepositoryConfig currentConfig;
    private static final String BASE_REPO_DIR = System.getenv("DROOLS_REPO_DIR") != null ? System.getenv("DROOLS_REPO_DIR") : "./repos/";
    private static final String CONFIG_FILE = "drools-config.json";
    private final ObjectMapper objectMapper = new ObjectMapper();

    public RepositoryConfigService() {
        loadConfigFromFile();
    }

    private void loadConfigFromFile() {
        File configFile = new File(CONFIG_FILE);
        if (configFile.exists()) {
            try {
                this.currentConfig = objectMapper.readValue(configFile, RepositoryConfig.class);
            } catch (IOException e) {
                System.err.println("Failed to load config from file: " + e.getMessage());
            }
        }
    }

    private void saveConfigToFile() {
        try {
            objectMapper.writeValue(new File(CONFIG_FILE), currentConfig);
        } catch (IOException e) {
            System.err.println("Failed to save config to file: " + e.getMessage());
        }
    }

    public void saveConfig(RepositoryConfig config) {
        this.currentConfig = new RepositoryConfig(
            config.getRepoUrl(),
            config.getBranch(),
            config.getDisplayName(),
            true
        );
        saveConfigToFile();
    }

    public RepositoryConfig getConfig() {
        return currentConfig;
    }

    public boolean isConfigured() {
        return currentConfig != null && 
               currentConfig.isConfigured() && 
               currentConfig.getRepoUrl() != null && 
               !currentConfig.getRepoUrl().trim().isEmpty() &&
               currentConfig.getBranch() != null && 
               !currentConfig.getBranch().trim().isEmpty();
    }

    public void clearConfig() {
        this.currentConfig = null;
        File configFile = new File(CONFIG_FILE);
        if (configFile.exists()) {
            configFile.delete();
        }
    }

    public String getRepositoryPath() {
        if (!isConfigured()) {
            throw new IllegalStateException("Repository not configured");
        }
        
        try {
            String repoUrl = currentConfig.getRepoUrl();
            
            if (repoUrl.startsWith("https://git-manager.devin.ai/proxy/")) {
                repoUrl = repoUrl.replace("https://git-manager.devin.ai/proxy/", "https://");
            }
            
            URI uri = new URI(repoUrl);
            String path = uri.getPath();
            
            if (path.endsWith(".git")) {
                path = path.substring(0, path.length() - 4);
            }
            
            String[] pathParts = path.split("/");
            String repoName = pathParts[pathParts.length - 1];
            
            File reposDir = new File(BASE_REPO_DIR);
            if (!reposDir.exists()) {
                reposDir.mkdirs();
            }
            
            return BASE_REPO_DIR + repoName;
        } catch (URISyntaxException e) {
            throw new IllegalArgumentException("Invalid repository URL: " + currentConfig.getRepoUrl(), e);
        }
    }

    public String getDisplayName() {
        if (!isConfigured()) {
            return "Repository";
        }
        
        if (currentConfig.getDisplayName() != null && !currentConfig.getDisplayName().trim().isEmpty()) {
            return currentConfig.getDisplayName();
        }
        
        try {
            String repoUrl = currentConfig.getRepoUrl();
            if (repoUrl.startsWith("https://git-manager.devin.ai/proxy/")) {
                repoUrl = repoUrl.replace("https://git-manager.devin.ai/proxy/", "https://");
            }
            
            URI uri = new URI(repoUrl);
            String path = uri.getPath();
            
            if (path.endsWith(".git")) {
                path = path.substring(0, path.length() - 4);
            }
            
            String[] pathParts = path.split("/");
            return pathParts[pathParts.length - 1];
        } catch (URISyntaxException e) {
            return "Repository";
        }
    }
}
