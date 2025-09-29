package com.example.droolsbackend.model;

public class RepositoryConfig {
    private String repoUrl;
    private String branch;
    private String displayName;
    private boolean isConfigured;

    public RepositoryConfig() {}

    public RepositoryConfig(String repoUrl, String branch, String displayName, boolean isConfigured) {
        this.repoUrl = repoUrl;
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
}
