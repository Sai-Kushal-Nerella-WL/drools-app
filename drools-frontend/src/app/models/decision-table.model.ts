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
