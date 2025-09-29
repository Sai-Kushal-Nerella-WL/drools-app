export interface RuleRow {
  name: string;
  values: any[];
}

export interface DecisionTableView {
  columnLabels: string[];
  templateLabels: string[];
  rows: RuleRow[];
}

export interface GitRequest {
  repoUrl?: string;
  branch?: string;
  fileName?: string;
  newBranch?: string;
  commitMessage?: string;
  baseBranch?: string;
  title?: string;
  body?: string;
}

export interface RepoConfig {
  repoUrl: string;
  branch: string;
  username?: string;
  password?: string;
  rulesFolder?: string;
}

export interface RepoValidationRequest {
  repoUrl: string;
  branch?: string;
  username?: string;
  password?: string;
}

export interface ValidationResult {
  isValid: boolean;
  message: string;
  detectedFolders?: string[];
}

export interface ConnectionResult {
  isConnected: boolean;
  message: string;
  branches?: string[];
}

export interface FolderDetectionResult {
  folders: string[];
  message: string;
}
