import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { RepoConfig } from '../models/decision-table.model';

@Injectable({
  providedIn: 'root'
})
export class RepoConfigService {
  private repoConfigSubject = new BehaviorSubject<RepoConfig | null>(null);
  public repoConfig$ = this.repoConfigSubject.asObservable();

  private validationStatusSubject = new BehaviorSubject<boolean>(false);
  public validationStatus$ = this.validationStatusSubject.asObservable();

  constructor() {
    this.loadFromStorage();
  }

  setRepoConfig(config: RepoConfig): void {
    this.repoConfigSubject.next(config);
    this.saveToStorage(config);
  }

  getRepoConfig(): RepoConfig | null {
    return this.repoConfigSubject.value;
  }

  setValidationStatus(isValid: boolean): void {
    this.validationStatusSubject.next(isValid);
  }

  getValidationStatus(): boolean {
    return this.validationStatusSubject.value;
  }

  clearConfig(): void {
    this.repoConfigSubject.next(null);
    this.validationStatusSubject.next(false);
    localStorage.removeItem('drools-repo-config');
  }

  private saveToStorage(config: RepoConfig): void {
    const configToSave = { ...config };
    delete configToSave.password;
    localStorage.setItem('drools-repo-config', JSON.stringify(configToSave));
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem('drools-repo-config');
    if (stored) {
      try {
        const config = JSON.parse(stored);
        this.repoConfigSubject.next(config);
      } catch (error) {
        console.error('Error loading repo config from storage:', error);
      }
    }
  }
}
