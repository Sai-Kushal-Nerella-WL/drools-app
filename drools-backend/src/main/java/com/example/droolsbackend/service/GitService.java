package com.example.droolsbackend.service;

import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.transport.UsernamePasswordCredentialsProvider;
import org.eclipse.jgit.lib.Ref;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.ArrayList;
import java.util.Collection;

@Service
public class GitService {

    private static final String BASE_REPO_DIR = "/home/ubuntu/repos/";
    
    private String getRepoDirectory(String repoUrl) {
        String repoName = repoUrl.substring(repoUrl.lastIndexOf('/') + 1);
        if (repoName.endsWith(".git")) {
            repoName = repoName.substring(0, repoName.length() - 4);
        }
        return BASE_REPO_DIR + repoName + "/";
    }

    public void pullFromRepo(String repoUrl, String branch) throws GitAPIException, IOException {
        String repoDirPath = getRepoDirectory(repoUrl);
        File repoDir = new File(repoDirPath);
        
        if (repoDir.exists()) {
            try (Git git = Git.open(repoDir)) {
                git.pull()
                   .setRemoteBranchName(branch)
                   .call();
            }
        } else {
            Git.cloneRepository()
               .setURI(repoUrl)
               .setDirectory(repoDir)
               .setBranch(branch)
               .call()
               .close();
        }
    }

    public void pushToRepo(String fileName, String repoUrl, String newBranch, String commitMessage) 
            throws GitAPIException, IOException {
        String repoDirPath = getRepoDirectory(repoUrl);
        File repoDir = new File(repoDirPath);
        
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
            
            git.push()
               .setRemote("origin")
               .add(newBranch)
               .call();
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
            UsernamePasswordCredentialsProvider credentialsProvider = null;
            if (username != null && password != null) {
                credentialsProvider = new UsernamePasswordCredentialsProvider(username, password);
            }

            Git.lsRemoteRepository()
               .setHeads(true)
               .setTags(false)
               .setRemote(repoUrl)
               .setCredentialsProvider(credentialsProvider)
               .call();
            
            return true;
        } catch (Exception e) {
            System.err.println("Repository validation failed: " + e.getMessage());
            return false;
        }
    }

    public boolean testRepositoryConnection(String repoUrl, String branch, String username, String password) {
        try {
            UsernamePasswordCredentialsProvider credentialsProvider = null;
            if (username != null && password != null) {
                credentialsProvider = new UsernamePasswordCredentialsProvider(username, password);
            }

            Collection<Ref> refs = Git.lsRemoteRepository()
                .setHeads(true)
                .setTags(false)
                .setRemote(repoUrl)
                .setCredentialsProvider(credentialsProvider)
                .call();

            if (branch != null && !branch.isEmpty()) {
                String branchRef = "refs/heads/" + branch;
                String masterRef = "refs/heads/master";
                String mainRef = "refs/heads/main";
                
                boolean branchExists = refs.stream()
                    .anyMatch(ref -> ref.getName().equals(branchRef) || 
                                   ref.getName().equals(masterRef) || 
                                   ref.getName().equals(mainRef));
                
                return branchExists;
            }
            
            return !refs.isEmpty();
        } catch (Exception e) {
            System.err.println("Connection test failed: " + e.getMessage());
            return false;
        }
    }

    public List<String> detectRulesFolders(String repoUrl, String branch, String username, String password) {
        List<String> folders = new ArrayList<>();
        
        try {
            String repoDirPath = getRepoDirectory(repoUrl);
            File repoDir = new File(repoDirPath);
            
            UsernamePasswordCredentialsProvider credentialsProvider = null;
            if (username != null && password != null) {
                credentialsProvider = new UsernamePasswordCredentialsProvider(username, password);
            }

            if (repoDir.exists()) {
                try (Git git = Git.open(repoDir)) {
                    git.pull()
                       .setRemoteBranchName(branch)
                       .setCredentialsProvider(credentialsProvider)
                       .call();
                }
            } else {
                Git.cloneRepository()
                   .setURI(repoUrl)
                   .setDirectory(repoDir)
                   .setBranch(branch)
                   .setCredentialsProvider(credentialsProvider)
                   .call()
                   .close();
            }

            scanForExcelFiles(repoDir, "", folders);
            
        } catch (Exception e) {
            System.err.println("Folder detection failed: " + e.getMessage());
        }
        
        return folders;
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
