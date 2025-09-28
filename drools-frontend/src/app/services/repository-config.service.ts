import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { RepositoryConfig } from '../models/repository-config.model';

@Injectable({
  providedIn: 'root'
})
export class RepositoryConfigService {
  private readonly STORAGE_KEY = 'drools-repository-config';
  private configSubject = new BehaviorSubject<RepositoryConfig | null>(null);
  
  constructor() {
    this.loadConfig();
  }

  getConfig(): Observable<RepositoryConfig | null> {
    return this.configSubject.asObservable();
  }

  getCurrentConfig(): RepositoryConfig | null {
    return this.configSubject.value;
  }

  saveConfig(config: RepositoryConfig): void {
    const configToSave = { ...config, isConfigured: true };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configToSave));
    this.configSubject.next(configToSave);
  }

  clearConfig(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.configSubject.next(null);
  }

  getRepositoryDisplayName(): string {
    const config = this.getCurrentConfig();
    return config?.displayName || config?.repoUrl?.split('/').pop() || 'Repository';
  }

  isConfigured(): boolean {
    const config = this.getCurrentConfig();
    return config?.isConfigured === true && !!config.repoUrl && !!config.branch;
  }

  private loadConfig(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const config = JSON.parse(stored) as RepositoryConfig;
        this.configSubject.next(config);
      }
    } catch (error) {
      console.error('Error loading repository config:', error);
      this.clearConfig();
    }
  }
}
