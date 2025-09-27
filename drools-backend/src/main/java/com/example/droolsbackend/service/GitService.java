package com.example.droolsbackend.service;

import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.transport.UsernamePasswordCredentialsProvider;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;

@Service
public class GitService {

    private static final String REPO_DIR = "/home/ubuntu/repos/drools-rules-lite/";

    public void pullFromRepo(String repoUrl, String branch) throws GitAPIException, IOException {
        File repoDir = new File(REPO_DIR);
        
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
}
