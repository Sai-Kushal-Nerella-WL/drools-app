import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DecisionTableView, GitRequest } from '../models/decision-table.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:8080/api';

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

  pushToRepo(request: GitRequest): Observable<{message: string}> {
    return this.http.post<{message: string}>(`${this.baseUrl}/git/push`, request);
  }

  createPullRequest(request: GitRequest): Observable<{message: string}> {
    return this.http.post<{message: string}>(`${this.baseUrl}/git/pr`, request);
  }

  getRepositoryConfig(): Observable<any> {
    return this.http.get(`${this.baseUrl}/repository/config`);
  }

  getRepositoryStatus(): Observable<any> {
    return this.http.get(`${this.baseUrl}/repository/status`);
  }

  listRemoteBranches(repoUrl: string): Observable<any[]> {
    return this.http.post<any[]>(`${this.baseUrl}/git/branches`, { repoUrl });
  }

  addColumn(fileName: string, columnType: 'CONDITION' | 'ACTION', columnName: string, templateValue: string): Observable<{message: string}> {
    return this.http.post<{message: string}>(`${this.baseUrl}/sheets/add-column`, { fileName, columnType, columnName, templateValue });
  }

  deleteColumn(fileName: string, columnIndex: number): Observable<{message: string}> {
    return this.http.post<{message: string}>(`${this.baseUrl}/sheets/delete-column`, { fileName, columnIndex });
  }

  executeRules(fileName: string, inputData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/sheets/execute-rules`, { fileName, inputData });
  }

  configureRepository(config: any): Observable<{message: string}> {
    return this.http.post<{message: string}>(`${this.baseUrl}/repository/configure`, config);
  }

  downloadSheet(fileName: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/sheets/download/${fileName}`, { 
      responseType: 'blob' 
    });
  }
}
