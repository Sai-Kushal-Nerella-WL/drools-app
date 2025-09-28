import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-file-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="file-list-container">
      <h3>Excel Decision Tables</h3>
      <div class="branch-indicator">
        <span class="branch-label">Files from: <strong>main branch</strong></span>
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
  
  @Output() fileSelected = new EventEmitter<string>();
  @Output() notificationRequested = new EventEmitter<{ message: string; type: 'success' | 'error' }>();

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadFiles();
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
    this.showNotification('Refreshing file list...', 'success');
    this.loadFiles();
  }

  pullFromGit() {
    this.isPulling = true;
    
    const repoUrl = 'https://github.com/Sai-Kushal-Nerella-WL/drools-rules-lite.git';
    this.apiService.pullFromRepo({ repoUrl, branch: 'main' }).subscribe({
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
}
