package com.example.droolsbackend.service;

import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.merge.MergeStrategy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class GitService {

    @Autowired
    private RepositoryConfigService repositoryConfigService;
    
    private final Object gitLock = new Object();

    public void pullFromRepo(String repoUrl, String branch) throws GitAPIException, IOException, InterruptedException {
        synchronized (gitLock) {
            String repoPath = deriveRepositoryPath(repoUrl);
            File repoDir = new File(repoPath);
            
            if (repoDir.exists()) {
                ProcessBuilder statusPb = new ProcessBuilder("git", "status", "--porcelain");
                statusPb.directory(repoDir);
                statusPb.redirectErrorStream(true);
                Process statusProcess = statusPb.start();
                
                StringBuilder statusOutput = new StringBuilder();
                try (java.io.BufferedReader reader = new java.io.BufferedReader(
                        new java.io.InputStreamReader(statusProcess.getInputStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        statusOutput.append(line).append("\n");
                    }
                }
                statusProcess.waitFor();
                
                if (statusOutput.length() > 0) {
                    throw new RuntimeException("Cannot pull: You have uncommitted changes. Please commit or discard your changes first.");
                }
                
                ProcessBuilder checkoutPb = new ProcessBuilder("git", "checkout", branch);
                checkoutPb.directory(repoDir);
                checkoutPb.redirectErrorStream(true);
                Process checkoutProcess = checkoutPb.start();
                checkoutProcess.waitFor();
                
                ProcessBuilder fetchPb = new ProcessBuilder("git", "fetch", "origin", branch);
                fetchPb.directory(repoDir);
                fetchPb.redirectErrorStream(true);
                Process fetchProcess = fetchPb.start();
                fetchProcess.waitFor();
                
                ProcessBuilder pb = new ProcessBuilder("git", "pull", "origin", branch);
                pb.directory(repoDir);
                pb.redirectErrorStream(true);
                Process process = pb.start();
                
                StringBuilder output = new StringBuilder();
                try (java.io.BufferedReader reader = new java.io.BufferedReader(
                        new java.io.InputStreamReader(process.getInputStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        output.append(line).append("\n");
                    }
                }
                
                int exitCode = process.waitFor();
                
                if (exitCode != 0) {
                    throw new RuntimeException("Git pull failed: " + output.toString().trim());
                }
            } else {
                repoDir.mkdirs();
                ProcessBuilder pb = new ProcessBuilder("git", "clone", repoUrl, repoDir.getName());
                pb.directory(repoDir.getParentFile());
                pb.redirectErrorStream(true);
                Process process = pb.start();
                
                StringBuilder output = new StringBuilder();
                try (java.io.BufferedReader reader = new java.io.BufferedReader(
                        new java.io.InputStreamReader(process.getInputStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        output.append(line).append("\n");
                    }
                }
                
                int exitCode = process.waitFor();
                
                if (exitCode != 0) {
                    throw new RuntimeException("Git clone failed: " + output.toString().trim());
                }
            }
        }
    }

    public String pushToRepo(String fileName, String repoUrl, String newBranch, String commitMessage) 
            throws GitAPIException, IOException, InterruptedException {
        synchronized (gitLock) {
            if (!repositoryConfigService.isConfigured()) {
                throw new IllegalStateException("Repository not configured. Please configure repository first.");
            }
            
            String repoPath = repositoryConfigService.getRepositoryPath();
            File repoDir = new File(repoPath);
            
            String branchToUse = (newBranch != null && !newBranch.trim().isEmpty()) 
                ? newBranch 
                : generateBranchName(fileName, repoUrl);
        
            try (Git git = Git.open(repoDir)) {
                git.checkout()
                   .setCreateBranch(true)
                   .setName(branchToUse)
                   .call();
            
            git.add()
               .addFilepattern("rules/" + fileName)
               .call();
            
                git.commit()
                   .setMessage(commitMessage)
                   .call();
            }
            
            ProcessBuilder pb = new ProcessBuilder("git", "push", "origin", branchToUse);
            pb.directory(repoDir);
            pb.redirectErrorStream(true);
            Process process = pb.start();
            
            StringBuilder output = new StringBuilder();
            try (java.io.BufferedReader reader = new java.io.BufferedReader(
                    new java.io.InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }
            }
            
            int exitCode = process.waitFor();
            
            if (exitCode != 0) {
                throw new RuntimeException("Git push failed: " + output.toString().trim());
            }
            
            return branchToUse;
        }
    }


    public java.util.List<java.util.Map<String, Object>> listRemoteBranches(String repoUrl) throws IOException, InterruptedException {
        java.util.List<java.util.Map<String, Object>> branches = new java.util.ArrayList<>();
        
        ProcessBuilder pb = new ProcessBuilder("git", "ls-remote", "--heads", repoUrl);
        pb.redirectErrorStream(true);
        Process process = pb.start();
        
        java.util.Map<String, String> branchCommits = new java.util.HashMap<>();
        StringBuilder output = new StringBuilder();
        try (java.io.BufferedReader reader = new java.io.BufferedReader(
                new java.io.InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
                if (line.contains("refs/heads/")) {
                    String[] parts = line.split("\\s+");
                    if (parts.length >= 2) {
                        String commitHash = parts[0];
                        String branchName = parts[1].substring(parts[1].lastIndexOf("refs/heads/") + 11);
                        branchCommits.put(branchName, commitHash);
                    }
                }
            }
        }
        
        int exitCode = process.waitFor();
        
        if (exitCode != 0) {
            throw new RuntimeException("Failed to list remote branches: " + output.toString().trim());
        }
        
        for (java.util.Map.Entry<String, String> entry : branchCommits.entrySet()) {
            String branchName = entry.getKey();
            String commitHash = entry.getValue();
            
            try {
                ProcessBuilder timestampPb = new ProcessBuilder("git", "show", "-s", "--format=%ct", commitHash);
                timestampPb.redirectErrorStream(true);
                Process timestampProcess = timestampPb.start();
                
                StringBuilder timestampOutput = new StringBuilder();
                try (java.io.BufferedReader timestampReader = new java.io.BufferedReader(
                        new java.io.InputStreamReader(timestampProcess.getInputStream()))) {
                    String timestampLine;
                    while ((timestampLine = timestampReader.readLine()) != null) {
                        timestampOutput.append(timestampLine);
                    }
                }
                
                long timestamp = 0;
                try {
                    timestamp = Long.parseLong(timestampOutput.toString().trim());
                } catch (NumberFormatException e) {
                    timestamp = System.currentTimeMillis() / 1000;
                }
                
                java.util.Map<String, Object> branchInfo = new java.util.HashMap<>();
                branchInfo.put("name", branchName);
                branchInfo.put("timestamp", timestamp);
                branchInfo.put("isMain", branchName.equals("main") || branchName.equals("master"));
                branches.add(branchInfo);
                
            } catch (Exception e) {
                java.util.Map<String, Object> branchInfo = new java.util.HashMap<>();
                branchInfo.put("name", branchName);
                branchInfo.put("timestamp", 0L);
                branchInfo.put("isMain", branchName.equals("main") || branchName.equals("master"));
                branches.add(branchInfo);
            }
        }
        
        branches.sort((a, b) -> Long.compare((Long) b.get("timestamp"), (Long) a.get("timestamp")));
        
        if (!branches.isEmpty()) {
            branches.get(0).put("isLatest", true);
        }
        
        if (branches.isEmpty()) {
            java.util.Map<String, Object> mainBranch = new java.util.HashMap<>();
            mainBranch.put("name", "main");
            mainBranch.put("timestamp", System.currentTimeMillis() / 1000);
            mainBranch.put("isMain", true);
            mainBranch.put("isLatest", true);
            branches.add(mainBranch);
        }
        
        return branches;
    }
    
    public String generateBranchName(String fileName, String repoUrl) {
        String repoName = extractRepoName(repoUrl);
        String repoPrefix = repoName.length() >= 3 ? repoName.substring(0, 3).toUpperCase() : repoName.toUpperCase();
        
        String fileNameWithoutExt = fileName.replaceAll("\\.(xlsx|xls)$", "");
        String filePrefix = fileNameWithoutExt.length() >= 3 ? fileNameWithoutExt.substring(0, 3).toUpperCase() : fileNameWithoutExt.toUpperCase();
        
        ZonedDateTime utcTime = ZonedDateTime.now(ZoneId.of("UTC"));
        String dateTime = utcTime.format(DateTimeFormatter.ofPattern("MMddyyyyHHmm"));
        
        return repoPrefix + "_" + filePrefix + "_" + dateTime;
    }
    
    private String extractRepoName(String repoUrl) {
        String repoName = repoUrl;
        if (repoUrl.contains("/")) {
            repoName = repoUrl.substring(repoUrl.lastIndexOf("/") + 1);
        }
        if (repoName.endsWith(".git")) {
            repoName = repoName.substring(0, repoName.length() - 4);
        }
        return repoName;
    }
    
    private String deriveRepositoryPath(String repoUrl) {
        try {
            if (repoUrl.startsWith("https://git-manager.devin.ai/proxy/")) {
                repoUrl = repoUrl.replace("https://git-manager.devin.ai/proxy/", "https://");
            }
            
            java.net.URI uri = new java.net.URI(repoUrl);
            String path = uri.getPath();
            
            if (path.endsWith(".git")) {
                path = path.substring(0, path.length() - 4);
            }
            
            String[] pathParts = path.split("/");
            String repoName = pathParts[pathParts.length - 1];
            
            String baseRepoDir = System.getenv("DROOLS_REPO_DIR") != null ? 
                System.getenv("DROOLS_REPO_DIR") : "./repos/";
            
            File reposDir = new File(baseRepoDir);
            if (!reposDir.exists()) {
                reposDir.mkdirs();
            }
            
            return baseRepoDir + repoName;
        } catch (java.net.URISyntaxException e) {
            throw new IllegalArgumentException("Invalid repository URL: " + repoUrl, e);
        }
    }
}
