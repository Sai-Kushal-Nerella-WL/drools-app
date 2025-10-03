import { Component, OnInit, OnDestroy, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { RepositoryConfigService } from '../../services/repository-config.service';

@Component({
  selector: 'app-file-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="file-list-container">
      <h3>Excel Decision Tables</h3>
      <div class="branch-indicator">
        <span class="branch-label">Files from: <strong>{{ getCurrentBranch() }} branch</strong></span>
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
          <button (click)="refreshFiles()" class="btn btn-secondary">Refresh</button>
          <button (click)="pullFromGit()" class="btn btn-primary" [disabled]="isPulling">
            <span *ngIf="isPulling" class="spinner"></span>
            {{ isPulling ? 'Pulling...' : 'Pull from Git' }}
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
      background-color: #ffffff;
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
      background-color: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      font-size: 14px;
      transition: all 0.3s ease;
    }

    .branch-label {
      color: #495057;
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
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .file-item:hover {
      background-color: #e9ecef;
      transform: translateX(2px);
    }

    .file-item.selected {
      background-color: #e3e6ea;
      color: #1b1b1b;
      transform: translateX(0);
      font-weight: 500;
    }
    
    .file-item:active {
      transform: scale(0.99);
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
      background-color: #ffffff;
    }

    .btn {
      padding: 10px 15px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      font-weight: 500;
    }

    .btn-primary {
      background-color: #2c3e50;
      color: white;
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-warning {
      background-color: #2c3e50;
      color: white;
    }

    .btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0,0,0,0.2);
      opacity: 0.9;
    }
    
    .btn:active:not(:disabled) {
      transform: translateY(0);
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
    /* Smooth scroll and hide scrollbars for the file list area */
    .file-list {
      scroll-behavior: smooth;
      -ms-overflow-style: none; /* IE/Edge */
      scrollbar-width: none; /* Firefox */
    }
    .file-list::-webkit-scrollbar {
      width: 0;
      height: 0;
      background: transparent;
    }


  `]
})
export class FileListComponent implements OnInit, OnDestroy {
  files: string[] = [];
  selectedFile: string | null = null;
  isPulling = false;
  private subscriptions: Subscription[] = [];

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
  }

  loadFiles() {
    const sub = this.apiService.listSheets().subscribe({
      next: (files) => {
        console.log('file list ', files);
        this.apiService.recentFilesLoaded.next(true);
        this.files = files;
      },
      error: (error) => {
        console.error('Error loading files:', error);
        this.showNotification('Failed to load files: ' + (error.error?.message || error.message), 'error');
      }
    });
    this.subscriptions.push(sub);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  selectFile(file: string) {
    this.selectedFile = file;
    this.fileSelected.emit(file);
  }

  refreshFiles() {
    this.showNotification('Refreshing file list...', 'success');
    this.loadFiles();
  }

  pullFromGit() {
    this.isPulling = true;

    const config = this.repositoryConfigService.getCurrentConfig();
    if (!config) {
      this.showNotification('Repository not configured', 'error');
      this.isPulling = false;
      return;
    }

    this.apiService.pullFromRepo({ repoUrl: config.repoUrl, branch: config.branch }).subscribe({
      next: (response) => {
        console.log('Pull successful:', response);
        this.isPulling = false;
        this.showNotification(response.message || `Successfully pulled latest changes from ${config.branch} branch`, 'success');
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
}
