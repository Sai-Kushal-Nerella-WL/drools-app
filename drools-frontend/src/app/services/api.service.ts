import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DecisionTableView, GitRequest, RepoValidationRequest, ValidationResult, ConnectionResult, FolderDetectionResult } from '../models/decision-table.model';

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

  saveSheet(fileName: string, view: DecisionTableView): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/sheets/save`, { fileName, view });
  }

  pullFromRepo(request: GitRequest): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/git/pull`, request);
  }

  pushToRepo(request: GitRequest): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/git/push`, request);
  }

  createPullRequest(request: GitRequest): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/git/pr`, request);
  }

  validateRepository(request: RepoValidationRequest): Observable<ValidationResult> {
    return this.http.post<ValidationResult>(`${this.baseUrl}/git/validate`, request);
  }

  testConnection(request: RepoValidationRequest): Observable<ConnectionResult> {
    return this.http.post<ConnectionResult>(`${this.baseUrl}/git/test-connection`, request);
  }

  detectFolders(request: RepoValidationRequest): Observable<FolderDetectionResult> {
    return this.http.post<FolderDetectionResult>(`${this.baseUrl}/git/detect-folders`, request);
  }
}
