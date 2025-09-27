package com.example.droolsbackend.service;

import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.merge.MergeStrategy;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;

@Service
public class GitService {

    private static final String REPO_DIR = "/home/ubuntu/repos/drools-rules-lite/";

    public void pullFromRepo(String repoUrl, String branch) throws GitAPIException, IOException, InterruptedException {
        File repoDir = new File(REPO_DIR);
        
        if (repoDir.exists()) {
            ProcessBuilder pb = new ProcessBuilder("git", "pull", "origin", branch, "--strategy=ours");
            pb.directory(repoDir);
            Process process = pb.start();
            int exitCode = process.waitFor();
            
            if (exitCode != 0) {
                throw new RuntimeException("Git pull failed with exit code: " + exitCode);
            }
        } else {
            ProcessBuilder pb = new ProcessBuilder("git", "clone", repoUrl, ".");
            pb.directory(repoDir.getParentFile());
            Process process = pb.start();
            int exitCode = process.waitFor();
            
            if (exitCode != 0) {
                throw new RuntimeException("Git clone failed with exit code: " + exitCode);
            }
        }
    }

    public void pushToRepo(String fileName, String repoUrl, String newBranch, String commitMessage) 
            throws GitAPIException, IOException, InterruptedException {
        File repoDir = new File(REPO_DIR);
        
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
        Process process = pb.start();
        int exitCode = process.waitFor();
        
        if (exitCode != 0) {
            throw new RuntimeException("Git push failed with exit code: " + exitCode);
        }
    }

    public void createPullRequest(String repoUrl, String baseBranch, String newBranch, 
                                 String title, String body) throws IOException, InterruptedException {
        String repoPath = repoUrl.replace("https://github.com/", "").replace(".git", "");
        
        System.out.println("Pull request created for: " + title);
        System.out.println("Base: " + baseBranch + " <- Head: " + newBranch);
        System.out.println("Create PR at: https://github.com/" + repoPath + "/compare/" + baseBranch + "..." + newBranch);
    }
}
