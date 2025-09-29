package com.example.droolsbackend.service;

import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.transport.UsernamePasswordCredentialsProvider;
import org.eclipse.jgit.lib.Ref;
import org.eclipse.jgit.api.TransportConfigCallback;
import org.eclipse.jgit.transport.Transport;
import org.eclipse.jgit.transport.HttpTransport;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.ArrayList;
import java.util.Collection;

@Service
public class GitService {

    private static final String BASE_REPO_DIR = "/home/ubuntu/repos/";
    
    @Value("${git.use-proxy:true}")
    private boolean useProxy;
    
    @Value("${git.proxy.host:git-manager.devin.ai}")
    private String proxyHost;
    
    @Value("${git.proxy.port:443}")
    private String proxyPort;
    
    private TransportConfigCallback createProxyTransportConfig() {
        return new TransportConfigCallback() {
            @Override
            public void configure(Transport transport) {
                if (useProxy && transport instanceof HttpTransport) {
                    System.setProperty("https.proxyHost", proxyHost);
                    System.setProperty("https.proxyPort", proxyPort);
                    System.setProperty("http.proxyHost", proxyHost);
                    System.setProperty("http.proxyPort", proxyPort);
                    System.out.println("Configured HTTP transport with proxy: " + proxyHost + ":" + proxyPort);
                } else {
                    System.clearProperty("https.proxyHost");
                    System.clearProperty("https.proxyPort");
                    System.clearProperty("http.proxyHost");
                    System.clearProperty("http.proxyPort");
                    System.out.println("Cleared proxy settings for direct GitHub access");
                }
            }
        };
    }
    
    private String transformRepositoryUrl(String repoUrl) {
        if (!useProxy) {
            if (repoUrl.contains("git-manager.devin.ai/proxy/")) {
                String directUrl = repoUrl.replace("https://git-manager.devin.ai/proxy/", "https://");
                System.out.println("Transformed proxy URL to direct URL: " + directUrl);
                return directUrl;
            }
            return repoUrl;
        } else {
            if (repoUrl.startsWith("https://github.com/")) {
                String proxyUrl = repoUrl.replace("https://github.com/", "https://git-manager.devin.ai/proxy/github.com/");
                System.out.println("Transformed direct URL to proxy URL: " + proxyUrl);
                return proxyUrl;
            }
            return repoUrl;
        }
    }
    
    private String getRepoDirectory(String repoUrl) {
        String repoName = repoUrl.substring(repoUrl.lastIndexOf('/') + 1);
        if (repoName.endsWith(".git")) {
            repoName = repoName.substring(0, repoName.length() - 4);
        }
        return BASE_REPO_DIR + repoName + "/";
    }

    public void pullFromRepo(String repoUrl, String branch) throws GitAPIException, IOException {
        String transformedUrl = transformRepositoryUrl(repoUrl);
        String repoDirPath = getRepoDirectory(repoUrl);
        File repoDir = new File(repoDirPath);
        
        if (repoDir.exists()) {
            try (Git git = Git.open(repoDir)) {
                git.pull()
                   .setRemoteBranchName(branch)
                   .setTransportConfigCallback(createProxyTransportConfig())
                   .call();
            }
        } else {
            Git.cloneRepository()
               .setURI(transformedUrl)
               .setDirectory(repoDir)
               .setBranch(branch)
               .setTransportConfigCallback(createProxyTransportConfig())
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
            
            var pushCommand = git.push()
               .setRemote("origin")
               .add(newBranch)
               .setTransportConfigCallback(createProxyTransportConfig());
            
            pushCommand.call();
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
            String transformedUrl = transformRepositoryUrl(repoUrl);
            
            UsernamePasswordCredentialsProvider credentialsProvider;
            if (username != null && password != null && !username.isEmpty() && !password.isEmpty()) {
                credentialsProvider = new UsernamePasswordCredentialsProvider(username, password);
            } else {
                credentialsProvider = new UsernamePasswordCredentialsProvider("", "");
            }

            Git.lsRemoteRepository()
               .setHeads(true)
               .setTags(false)
               .setRemote(transformedUrl)
               .setCredentialsProvider(credentialsProvider)
               .setTransportConfigCallback(createProxyTransportConfig())
               .call();
            
            return true;
        } catch (Exception e) {
            System.err.println("Repository validation failed: " + e.getMessage());
            if (e.getMessage().contains("not authorized")) {
                System.err.println("Proxy authentication may be required for Git operations");
            }
            return false;
        }
    }

    public boolean testRepositoryConnection(String repoUrl, String branch, String username, String password) {
        try {
            String transformedUrl = transformRepositoryUrl(repoUrl);
            
            UsernamePasswordCredentialsProvider credentialsProvider;
            if (username != null && password != null && !username.isEmpty() && !password.isEmpty()) {
                credentialsProvider = new UsernamePasswordCredentialsProvider(username, password);
            } else {
                credentialsProvider = new UsernamePasswordCredentialsProvider("", "");
            }

            Collection<Ref> refs = Git.lsRemoteRepository()
                .setHeads(true)
                .setTags(false)
                .setRemote(transformedUrl)
                .setCredentialsProvider(credentialsProvider)
                .setTransportConfigCallback(createProxyTransportConfig())
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
            if (e.getMessage().contains("not authorized")) {
                System.err.println("Proxy authentication may be required for Git operations");
            }
            return false;
        }
    }

    public List<String> detectRulesFolders(String repoUrl, String branch, String username, String password) {
        List<String> folders = new ArrayList<>();
        
        try {
            String transformedUrl = transformRepositoryUrl(repoUrl);
            String repoDirPath = getRepoDirectory(repoUrl);
            File repoDir = new File(repoDirPath);
            
            UsernamePasswordCredentialsProvider credentialsProvider;
            if (username != null && password != null && !username.isEmpty() && !password.isEmpty()) {
                credentialsProvider = new UsernamePasswordCredentialsProvider(username, password);
            } else {
                credentialsProvider = new UsernamePasswordCredentialsProvider("", "");
            }

            if (repoDir.exists()) {
                try (Git git = Git.open(repoDir)) {
                    git.pull()
                       .setRemoteBranchName(branch)
                       .setCredentialsProvider(credentialsProvider)
                       .setTransportConfigCallback(createProxyTransportConfig())
                       .call();
                }
            } else {
                Git.cloneRepository()
                   .setURI(transformedUrl)
                   .setDirectory(repoDir)
                   .setBranch(branch)
                   .setCredentialsProvider(credentialsProvider)
                   .setTransportConfigCallback(createProxyTransportConfig())
                   .call()
                   .close();
            }

            scanForExcelFiles(repoDir, "", folders);
            
        } catch (Exception e) {
            System.err.println("Folder detection failed: " + e.getMessage());
            if (e.getMessage().contains("not authorized")) {
                System.err.println("Proxy authentication may be required for Git operations");
            }
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
