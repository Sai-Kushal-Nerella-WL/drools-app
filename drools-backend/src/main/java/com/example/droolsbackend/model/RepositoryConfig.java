package com.example.droolsbackend.model;

public class RepositoryConfig {
    public enum RepositoryType {
        GIT, LOCAL_FILESYSTEM
    }
    
    private RepositoryType repositoryType = RepositoryType.GIT;
    private String repoUrl;
    private String localPath;
    private String branch;
    private String displayName;
    private boolean isConfigured;

    public RepositoryConfig() {}

    public RepositoryConfig(String repoUrl, String branch, String displayName, boolean isConfigured) {
        this.repositoryType = RepositoryType.GIT;
        this.repoUrl = repoUrl;
        this.branch = branch;
        this.displayName = displayName;
        this.isConfigured = isConfigured;
    }

    public RepositoryConfig(RepositoryType repositoryType, String repoUrl, String localPath, String branch, String displayName, boolean isConfigured) {
        this.repositoryType = repositoryType;
        this.repoUrl = repoUrl;
        this.localPath = localPath;
        this.branch = branch;
        this.displayName = displayName;
        this.isConfigured = isConfigured;
    }

    public String getRepoUrl() {
        return repoUrl;
    }

    public void setRepoUrl(String repoUrl) {
        this.repoUrl = repoUrl;
    }

    public String getBranch() {
        return branch;
    }

    public void setBranch(String branch) {
        this.branch = branch;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public boolean isConfigured() {
        return isConfigured;
    }

    public void setConfigured(boolean configured) {
        isConfigured = configured;
    }

    public RepositoryType getRepositoryType() {
        return repositoryType;
    }

    public void setRepositoryType(RepositoryType repositoryType) {
        this.repositoryType = repositoryType;
    }

    public String getLocalPath() {
        return localPath;
    }

    public void setLocalPath(String localPath) {
        this.localPath = localPath;
    }
}
