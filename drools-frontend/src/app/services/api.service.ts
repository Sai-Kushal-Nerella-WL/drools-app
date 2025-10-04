import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { DecisionTableView, GitRequest } from '../models/decision-table.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;
  public recentFilesLoaded = new Subject<boolean>();

  constructor(private http: HttpClient) {}

  listSheets(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/sheets`);
  }

  openSheet(fileName: string): Observable<DecisionTableView> {
    return this.http.post<DecisionTableView>(`${this.baseUrl}/sheets/open`, { fileName });
  }

  saveSheet(fileName: string, view: DecisionTableView): Observable<{message: string}> {
    return this.http.post<{message: string}>(`${this.baseUrl}/sheets/save`, { fileName, view });
  }

  pullFromRepo(request: GitRequest): Observable<{message: string}> {
    return this.http.post<{message: string}>(`${this.baseUrl}/git/pull`, request);
  }

  pushToRepo(request: GitRequest): Observable<{message: string; branchName?: string}> {
    return this.http.post<{message: string; branchName?: string}>(`${this.baseUrl}/git/push`, request);
  }


  getRepositoryConfig(): Observable<any> {
    return this.http.get(`${this.baseUrl}/repository/config`);
  }

  listRepositoryFolders(repoUrl?: string): Observable<{folders: string[]}> {
    let url = `${this.baseUrl}/repository/folders`;
    if (repoUrl) {
      url += `?repoUrl=${encodeURIComponent(repoUrl)}`;
    }
    return this.http.get<{folders: string[]}>(url);
  }

  getRepositoryStatus(): Observable<any> {
    return this.http.get(`${this.baseUrl}/repository/status`);
  }

  listRemoteBranches(repoUrl: string): Observable<any[]> {
    return this.http.post<any[]>(`${this.baseUrl}/git/branches`, { repoUrl });
  }

  // addColumn(fileName: string, columnType: 'CONDITION' | 'ACTION', columnName: string, templateValue: string): Observable<{message: string}> {
  //   return this.http.post<{message: string}>(`${this.baseUrl}/sheets/add-column`, { fileName, columnType, columnName, templateValue });
  // }

  // deleteColumn(fileName: string, columnIndex: number): Observable<{message: string}> {
  //   return this.http.post<{message: string}>(`${this.baseUrl}/sheets/delete-column`, { fileName, columnIndex });
  // }

  executeRules(fileName: string, inputData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/sheets/execute-rules`, { fileName, inputData });
  }

  generateBranchName(request: GitRequest): Observable<{branchName: string}> {
    return this.http.post<{branchName: string}>(`${this.baseUrl}/git/generate-branch-name`, request);
  }
}
