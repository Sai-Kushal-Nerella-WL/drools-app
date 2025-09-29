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
      padding: 20px;
      border-right: 1px solid #ddd;
      height: 100vh;
      background-color: #f8f9fa;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    
    h3 {
      margin-bottom: 15px;
      color: #333;
    }
    
    .branch-indicator {
      margin-bottom: 20px;
      padding: 8px 12px;
      background-color: #e3f2fd;
      border: 1px solid #2196f3;
      border-radius: 4px;
      font-size: 14px;
    }
    
    .branch-label {
      color: #1976d2;
    }
    
    .file-list {
      overflow-y: auto;
      flex: 1;
      min-height: 0;
    }
    
    .file-item {
      padding: 10px;
      margin-bottom: 5px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .file-item:hover {
      background-color: #e9ecef;
    }
    
    .file-item.selected {
      background-color: #007bff;
      color: white;
    }
    
    .no-files {
      padding: 20px;
      text-align: center;
      color: #666;
      font-style: italic;
    }
    
    .actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 10px;
      border-top: 1px solid #ddd;
      margin-top: 10px;
      background-color: #f8f9fa;
    }
    
    .btn {
      padding: 10px 15px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    
    .btn-primary {
      background-color: #007bff;
      color: white;
    }
    
    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }
    
    .btn-warning {
      background-color: #ffc107;
      color: #212529;
    }
    
    .btn-success {
      background-color: #28a745;
      color: white;
    }
    
    .btn-switch {
      background-color: #17a2b8;
      color: white;
      font-size: 12px;
      padding: 4px 8px;
      margin-left: 10px;
    }
    
    .btn:hover {
      opacity: 0.9;
    }
    
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .spinner {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 2px solid #ffffff;
      border-radius: 50%;
      border-top-color: transparent;
      animation: spin 1s ease-in-out infinite;
      margin-right: 5px;
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
