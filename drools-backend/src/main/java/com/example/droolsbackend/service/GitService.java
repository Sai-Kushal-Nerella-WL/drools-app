package com.example.droolsbackend.service;

import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.merge.MergeStrategy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.ArrayList;

@Service
public class GitService {

    @Autowired
    private RepositoryConfigService repositoryConfigService;
    

    public void pullFromRepo(String repoUrl, String branch) throws GitAPIException, IOException, InterruptedException {
        if (!repositoryConfigService.isConfigured()) {
            throw new IllegalStateException("Repository not configured. Please configure repository first.");
        }
        
        String repoPath = repositoryConfigService.getRepositoryPath();
        File repoDir = new File(repoPath);
        
        if (repoDir.exists()) {
            ProcessBuilder stashPb = new ProcessBuilder("git", "stash", "push", "-m", "Auto-stash before pull");
            stashPb.directory(repoDir);
            stashPb.redirectErrorStream(true);
            Process stashProcess = stashPb.start();
            stashProcess.waitFor();
            
            ProcessBuilder checkoutPb = new ProcessBuilder("git", "checkout", branch);
            checkoutPb.directory(repoDir);
            checkoutPb.redirectErrorStream(true);
            Process checkoutProcess = checkoutPb.start();
            checkoutProcess.waitFor();
            
            ProcessBuilder pb = new ProcessBuilder("git", "pull", "origin", branch, "--strategy=ours");
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

    public void pushToRepo(String fileName, String repoUrl, String newBranch, String commitMessage) 
            throws GitAPIException, IOException, InterruptedException {
        if (!repositoryConfigService.isConfigured()) {
            throw new IllegalStateException("Repository not configured. Please configure repository first.");
        }
        
        String repoPath = repositoryConfigService.getRepositoryPath();
        File repoDir = new File(repoPath);
        
        try (Git git = Git.open(repoDir)) {
            git.checkout()
               .setCreateBranch(true)
               .setName(newBranch)
               .call();
            
            git.add()
               .addFilepattern("rules/" + fileName)
               .call();
            
            git.commit()
               .setMessage(commitMessage)
               .call();
        }
        
        ProcessBuilder pb = new ProcessBuilder("git", "push", "origin", newBranch);
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
    }

    public void createPullRequest(String repoUrl, String baseBranch, String newBranch, 
                                 String title, String body) {
        System.out.println("PR Creation Request:");
        System.out.println("Base: " + baseBranch + " <- Head: " + newBranch);
        System.out.println("Title: " + title);
        System.out.println("Body: " + body);
    }

    public boolean validateRepositoryUrl(String repoUrl, String username, String password) {
        try {
            ProcessBuilder pb = new ProcessBuilder("git", "ls-remote", "--heads", repoUrl);
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
            return exitCode == 0 && output.length() > 0;
        } catch (Exception e) {
            System.err.println("Repository validation failed: " + e.getMessage());
            return false;
        }
    }

    public boolean testRepositoryConnection(String repoUrl, String branch, String username, String password) {
        try {
            ProcessBuilder pb = new ProcessBuilder("git", "ls-remote", "--heads", repoUrl);
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
            
            if (exitCode == 0) {
                repositoryConfigService.configure(repoUrl, branch, username, password);
                return true;
            }
            
            return false;
        } catch (Exception e) {
            System.err.println("Connection test failed: " + e.getMessage());
            return false;
        }
    }

    public List<String> detectRulesFolders(String repoUrl, String branch, String username, String password) {
        List<String> folders = new ArrayList<>();
        
        try {
            String repoName = repoUrl.substring(repoUrl.lastIndexOf('/') + 1);
            if (repoName.endsWith(".git")) {
                repoName = repoName.substring(0, repoName.length() - 4);
            }
            
            String repoPath = "/home/ubuntu/repos/" + repoName;
            File repoDir = new File(repoPath);
            
            if (repoDir.exists()) {
                ProcessBuilder stashPb = new ProcessBuilder("git", "stash", "push", "-m", "Auto-stash before pull");
                stashPb.directory(repoDir);
                stashPb.redirectErrorStream(true);
                Process stashProcess = stashPb.start();
                stashProcess.waitFor();
                
                ProcessBuilder checkoutPb = new ProcessBuilder("git", "checkout", branch);
                checkoutPb.directory(repoDir);
                checkoutPb.redirectErrorStream(true);
                Process checkoutProcess = checkoutPb.start();
                checkoutProcess.waitFor();
                
                ProcessBuilder pb = new ProcessBuilder("git", "pull", "origin", branch, "--strategy=ours");
                pb.directory(repoDir);
                pb.redirectErrorStream(true);
                Process process = pb.start();
                process.waitFor();
            } else {
                repoDir.mkdirs();
                ProcessBuilder pb = new ProcessBuilder("git", "clone", repoUrl, repoDir.getName());
                pb.directory(repoDir.getParentFile());
                pb.redirectErrorStream(true);
                Process process = pb.start();
                
                int exitCode = process.waitFor();
                if (exitCode != 0) {
                    throw new RuntimeException("Git clone failed");
                }
            }

            scanForExcelFiles(repoDir, "", folders);
            
        } catch (Exception e) {
            System.err.println("Folder detection failed: " + e.getMessage());
        }
        
        return folders;
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

    private void scanForExcelFiles(File directory, String relativePath, List<String> folders) {
        if (!directory.exists() || !directory.isDirectory()) {
            return;
        }

        File[] files = directory.listFiles();
        if (files == null) {
            return;
        }

        boolean hasExcelFiles = false;
        for (File file : files) {
            if (file.isFile() && file.getName().toLowerCase().endsWith(".xlsx")) {
                hasExcelFiles = true;
                break;
            }
        }

        if (hasExcelFiles && !folders.contains(relativePath)) {
            folders.add(relativePath);
        }

        for (File file : files) {
            if (file.isDirectory() && !file.getName().startsWith(".")) {
                String newRelativePath = relativePath.isEmpty() ? 
                    file.getName() : relativePath + "/" + file.getName();
                scanForExcelFiles(file, newRelativePath, folders);
            }
        }
    }
}
