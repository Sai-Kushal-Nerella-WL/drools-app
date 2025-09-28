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
}
