import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RepositoryConfig, RepositoryType } from '../models/repository-config.model';

@Injectable({
  providedIn: 'root'
})
export class RepositoryConfigService {
  private readonly STORAGE_KEY = 'drools-repository-config';
  public configSubject = new BehaviorSubject<RepositoryConfig | null>(null);
  private baseUrl = 'http://localhost:8080/api';
  
  constructor(private http: HttpClient) {
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
    
    this.syncWithBackend(configToSave).subscribe({
      next: (response) => {
        console.log('Repository configuration synced with backend:', response);
      },
      error: (error) => {
        console.error('Failed to sync repository configuration with backend:', error);
      }
    });
  }

  clearConfig(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.configSubject.next(null);
    
    this.clearBackendConfig().subscribe({
      next: (response) => {
        console.log('Repository configuration cleared from backend:', response);
      },
      error: (error) => {
        console.error('Failed to clear repository configuration from backend:', error);
      }
    });
  }

  getRepositoryDisplayName(): string {
    const config = this.getCurrentConfig();
    if (config?.displayName) {
      return config.displayName;
    }
    
    if (config?.repositoryType === RepositoryType.LOCAL_FILESYSTEM) {
      return config?.localPath?.split('/').pop() || 'Local Repository';
    }
    
    return config?.repoUrl?.split('/').pop() || 'Repository';
  }

  isConfigured(): boolean {
    const config = this.getCurrentConfig();
    if (!config?.isConfigured) {
      return false;
    }
    
    if (config.repositoryType === RepositoryType.LOCAL_FILESYSTEM) {
      return !!config.localPath;
    }
    
    return !!config.repoUrl && !!config.branch;
  }

  private loadConfig(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const config = JSON.parse(stored) as RepositoryConfig;
        this.configSubject.next(config);
        
        this.syncWithBackend(config).subscribe({
          next: (response) => {
            console.log('Repository configuration loaded and synced with backend:', response);
          },
          error: (error) => {
            console.error('Failed to sync loaded configuration with backend:', error);
          }
        });
      }
    } catch (error) {
      console.error('Error loading repository config:', error);
      this.clearConfig();
    }
  }

  private syncWithBackend(config: RepositoryConfig): Observable<any> {
    return this.http.post(`${this.baseUrl}/repository/config`, config);
  }

  private clearBackendConfig(): Observable<any> {
    return this.http.delete(`${this.baseUrl}/repository/config`);
  }

  getBackendConfig(): Observable<RepositoryConfig> {
    return this.http.get<RepositoryConfig>(`${this.baseUrl}/repository/config`);
  }

  getBackendStatus(): Observable<any> {
    return this.http.get(`${this.baseUrl}/repository/status`);
  }

  updateBranch(newBranch: string): void {
    const currentConfig = this.getCurrentConfig();
    if (currentConfig) {
      const updatedConfig = { ...currentConfig, branch: newBranch };
      this.saveConfig(updatedConfig);
      this.configSubject.next(updatedConfig);
    }
  }
}
