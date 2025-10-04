export interface RepositoryConfig {
  repoUrl: string;
  branch: string;
  displayName?: string;
  folderPath?: string;
  isConfigured: boolean;
}

export interface RepositoryConfigRequest {
  repoUrl: string;
  branch: string;
  displayName?: string;
  folderPath?: string;
}
