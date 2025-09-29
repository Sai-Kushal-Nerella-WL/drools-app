import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { RepositoryConfigService } from '../../services/repository-config.service';

@Component({
  selector: 'app-file-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="file-list-container">
      <h3>{{ getDisplayTitle() }}</h3>
      <div class="branch-indicator" *ngIf="isGitRepository()">
        <span class="branch-label">Files from: <strong>{{ getCurrentBranch() }} branch</strong></span>
        <button 
          *ngIf="getCurrentBranch() !== 'main'" 
          (click)="switchToMainBranch()" 
          class="btn btn-switch"
          [disabled]="isSwitchingBranch"
          title="Switch to main branch to enable editing">
          <span *ngIf="isSwitchingBranch" class="spinner"></span>
          {{ isSwitchingBranch ? 'Switching...' : 'Switch to Main' }}
        </button>
      </div>
      <div class="branch-indicator" *ngIf="!isGitRepository()">
        <span class="branch-label">Files from: <strong>Local File System</strong></span>
      </div>
      <div class="file-list">
        <div 
          *ngFor="let file of files" 
          class="file-item"
          [class.selected]="file === selectedFile"
          (click)="selectFile(file)">
          {{ file }}
        </div>
        <div *ngIf="files.length === 0" class="no-files">
          No Excel files found
        </div>
        <div class="actions">
          <button (click)="refreshFiles()" class="btn btn-secondary" [disabled]="isRefreshing">
            <span *ngIf="isRefreshing" class="spinner"></span>
            {{ isRefreshing ? 'Refreshing...' : 'Refresh' }}
          </button>
          <button (click)="pullFromGit()" class="btn btn-primary" [disabled]="isPulling || !isGitRepository()" *ngIf="isGitRepository()">
            <span *ngIf="isPulling" class="spinner"></span>
            {{ isPulling ? 'Pulling...' : 'Pull from Git' }}
          </button>
          <button (click)="downloadFile()" class="btn btn-success" [disabled]="!selectedFile || isDownloading">
            <span *ngIf="isDownloading" class="spinner"></span>
            {{ isDownloading ? 'Downloading...' : 'Download File' }}
          </button>
          <button (click)="changeRepository()" class="btn btn-warning">Change Repository</button>
        </div>
      </div>
      
    </div>
  `,
  styles: [`
    .file-list-container {
      padding: 24px;
      border-right: none;
      height: 100vh;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 2px 0 8px rgba(148, 163, 184, 0.08);
    }
    
    h3 {
      margin-bottom: 20px;
      color: #1e293b;
      font-weight: 700;
      font-size: 24px;
      letter-spacing: -0.02em;
      transition: color 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    
    .branch-indicator {
      margin-bottom: 24px;
      padding: 16px 20px;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%);
      border: 2px solid #3b82f6;
      border-radius: 16px;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.12);
      transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      position: relative;
      overflow: hidden;
    }
    
    .branch-indicator::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.05), transparent);
      transition: left 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    
    .branch-indicator:hover {
      box-shadow: 0 6px 20px rgba(59, 130, 246, 0.18);
      transform: translateY(-2px);
      border-color: #2563eb;
    }
    
    .branch-indicator:hover::before {
      left: 100%;
    }
    
    .branch-label {
      color: #1e40af;
      font-weight: 600;
      position: relative;
      z-index: 1;
    }
    
    .file-list {
      overflow-y: auto;
      flex: 1;
      min-height: 0;
      padding-right: 4px;
    }
    
    .file-item {
      padding: 14px 16px;
      margin-bottom: 8px;
      background: rgba(255, 255, 255, 0.9);
      border: 2px solid transparent;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      font-weight: 500;
      color: #334155;
      box-shadow: 0 2px 4px rgba(148, 163, 184, 0.08);
      position: relative;
      overflow: hidden;
    }
    
    .file-item::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent);
      transition: left 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    
    .file-item:hover {
      background: rgba(255, 255, 255, 1);
      border-color: #3b82f6;
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
    }
    
    .file-item:hover::before {
      left: 100%;
    }
    
    .file-item.selected {
      background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
      color: white;
      border-color: #2563eb;
      box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
      transform: translateY(-2px);
      position: relative;
      z-index: 1;
    }
    
    .no-files {
      padding: 32px 20px;
      text-align: center;
      color: #64748b;
      font-style: italic;
      font-weight: 500;
      background: rgba(255, 255, 255, 0.6);
      border-radius: 12px;
      border: 2px dashed #cbd5e1;
    }
    
    .actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 20px 0;
      border-top: 2px solid rgba(148, 163, 184, 0.2);
      margin-top: 20px;
    }
    
    .btn {
      padding: 12px 18px;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      position: relative;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      transition: left 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    
    .btn:hover:not(:disabled)::before {
      left: 100%;
    }
    
    .btn-primary {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
    }
    
    .btn-primary:hover:not(:disabled) {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
    }
    
    .btn-secondary {
      background: linear-gradient(135deg, #64748b 0%, #475569 100%);
      color: white;
    }
    
    .btn-secondary:hover:not(:disabled) {
      background: linear-gradient(135deg, #475569 0%, #334155 100%);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(100, 116, 139, 0.3);
    }
    
    .btn-warning {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
    }
    
    .btn-warning:hover:not(:disabled) {
      background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(245, 158, 11, 0.3);
    }
    
    .btn-success {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }
    
    .btn-success:hover:not(:disabled) {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
    }
    
    .btn-switch {
      background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
      color: white;
      font-size: 12px;
      padding: 6px 12px;
      margin-left: 12px;
      border-radius: 8px;
    }
    
    .btn-switch:hover:not(:disabled) {
      background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(6, 182, 212, 0.3);
    }
    
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none !important;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
    }
    
    .spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 1s ease-in-out infinite;
      margin-right: 8px;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
  `]
})
export class FileListComponent implements OnInit {
  files: string[] = [];
  selectedFile: string | null = null;
  isPulling = false;
  isRefreshing = false;
  isDownloading = false;
  isSwitchingBranch = false;
  
  @Input() repositoryConfigurationChanged!: EventEmitter<void>;
  @Output() fileSelected = new EventEmitter<string>();
  @Output() notificationRequested = new EventEmitter<{ message: string; type: 'success' | 'error' }>();
  @Output() repositoryChangeRequested = new EventEmitter<void>();

  constructor(
    private apiService: ApiService,
    private repositoryConfigService: RepositoryConfigService
  ) {}

  ngOnInit() {
    this.loadFiles();
    
    if (this.repositoryConfigurationChanged) {
      this.repositoryConfigurationChanged.subscribe(() => {
        this.loadFiles();
        this.showNotification('File list refreshed for new repository', 'success');
      });
    }
    
    this.repositoryConfigService.configSubject.subscribe(config => {
      if (config) {
        this.loadFiles();
      }
    });
  }

  loadFiles() {
    this.apiService.listSheets().subscribe({
      next: (files) => {
        this.files = files;
      },
      error: (error) => {
        console.error('Error loading files:', error);
      }
    });
  }

  selectFile(file: string) {
    this.selectedFile = file;
    this.fileSelected.emit(file);
  }

  refreshFiles() {
    this.isRefreshing = true;
    this.showNotification('Refreshing file list...', 'success');
    this.apiService.listSheets().subscribe({
      next: (files) => {
        this.files = files;
        this.isRefreshing = false;
        this.showNotification('File list refreshed successfully', 'success');
      },
      error: (error) => {
        console.error('Error refreshing files:', error);
        this.isRefreshing = false;
        this.showNotification('Failed to refresh file list', 'error');
      }
    });
  }

  pullFromGit() {
    this.isPulling = true;
    
    const config = this.repositoryConfigService.getCurrentConfig();
    if (!config) {
      this.showNotification('Repository not configured', 'error');
      this.isPulling = false;
      return;
    }
    
    if (!config.repoUrl || config.repositoryType === 'LOCAL_FILESYSTEM') {
      this.showNotification('Pull from Git is only available for Git repositories', 'error');
      this.isPulling = false;
      return;
    }
    
    this.apiService.pullFromRepo({ repoUrl: config.repoUrl, branch: config.branch }).subscribe({
      next: (response) => {
        console.log('Pull successful:', response);
        this.isPulling = false;
        this.showNotification(response.message || 'Successfully pulled latest changes from Git', 'success');
        this.loadFiles();
      },
      error: (error) => {
        console.error('Error pulling from Git:', error);
        this.isPulling = false;
        this.showNotification('Failed to pull from Git: ' + (error.error?.error || error.error?.message || error.message), 'error');
      }
    });
  }

  showNotification(message: string, type: 'success' | 'error') {
    this.notificationRequested.emit({ message, type });
  }

  clearNotification() {
  }

  getCurrentBranch(): string {
    const config = this.repositoryConfigService.getCurrentConfig();
    return config?.branch || 'main';
  }

  changeRepository() {
    this.repositoryConfigService.clearConfig();
    this.repositoryChangeRequested.emit();
    this.showNotification('Repository configuration cleared. Please configure a new repository.', 'success');
  }

  getDisplayTitle(): string {
    const config = this.repositoryConfigService.getCurrentConfig();
    return config?.displayName || 'Excel Decision Tables';
  }

  switchToMainBranch() {
    this.isSwitchingBranch = true;
    const config = this.repositoryConfigService.getCurrentConfig();
    
    if (!config) {
      this.showNotification('Repository not configured', 'error');
      this.isSwitchingBranch = false;
      return;
    }

    const mainConfig = { ...config, branch: 'main' };
    this.repositoryConfigService.saveConfig(mainConfig);
    
    this.apiService.configureRepository(mainConfig).subscribe({
      next: (response: any) => {
        this.isSwitchingBranch = false;
        this.showNotification('Switched to main branch successfully', 'success');
        this.loadFiles();
      },
      error: (error: any) => {
        console.error('Error switching to main branch:', error);
        this.isSwitchingBranch = false;
        this.showNotification('Failed to switch to main branch: ' + (error.error?.message || error.message), 'error');
      }
    });
  }

  downloadFile() {
    if (!this.selectedFile) {
      this.showNotification('Please select a file to download', 'error');
      return;
    }

    this.isDownloading = true;
    this.apiService.downloadSheet(this.selectedFile).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = this.selectedFile!;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        this.isDownloading = false;
        this.showNotification(`Downloaded ${this.selectedFile} successfully`, 'success');
      },
      error: (error: any) => {
        console.error('Error downloading file:', error);
        this.isDownloading = false;
        this.showNotification('Failed to download file: ' + (error.error?.message || error.message), 'error');
      }
    });
  }

  isGitRepository(): boolean {
    const config = this.repositoryConfigService.getCurrentConfig();
    return config?.repositoryType !== 'LOCAL_FILESYSTEM';
  }
}
