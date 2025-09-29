export enum RepositoryType {
  GIT = 'GIT',
  LOCAL_FILESYSTEM = 'LOCAL_FILESYSTEM'
}

export interface RepositoryConfig {
  repositoryType: RepositoryType;
  repoUrl?: string;
  localPath?: string;
  branch?: string;
  displayName?: string;
  isConfigured: boolean;
}

export interface RepositoryConfigRequest {
  repositoryType: RepositoryType;
  repoUrl?: string;
  localPath?: string;
  branch?: string;
  displayName?: string;
}
