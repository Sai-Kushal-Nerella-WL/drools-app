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
      </div>
      <div class="actions">
        <button (click)="refreshFiles()" class="btn btn-secondary">Refresh</button>
        <button (click)="pullFromGit()" class="btn btn-primary" [disabled]="isPulling">
          <span *ngIf="isPulling" class="spinner"></span>
          {{ isPulling ? 'Pulling...' : 'Pull from Git' }}
        </button>
      </div>
      
      <!-- Notification -->
      <div *ngIf="notification" class="notification" [class]="notification.type">
        {{ notification.message }}
        <button (click)="clearNotification()" class="close-btn">&times;</button>
      </div>
    </div>
  `,
  styles: [`
    .file-list-container {
      padding: 20px;
      border-right: 1px solid #ddd;
      height: 100vh;
      background-color: #f8f9fa;
    }
    
    h3 {
      margin-bottom: 20px;
      color: #333;
    }
    
    .file-list {
      margin-bottom: 20px;
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
    
    .notification {
      margin-top: 15px;
      padding: 10px;
      border-radius: 4px;
      position: relative;
      font-size: 14px;
    }
    
    .notification.success {
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    
    .notification.error {
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
    
    .close-btn {
      position: absolute;
      top: 5px;
      right: 10px;
      background: none;
      border: none;
      font-size: 16px;
      cursor: pointer;
      color: inherit;
    }
  `]
})
export class FileListComponent implements OnInit {
  files: string[] = [];
  selectedFile: string | null = null;
  isPulling = false;
  notification: { message: string; type: 'success' | 'error' } | null = null;
  
  @Output() fileSelected = new EventEmitter<string>();

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
    this.loadFiles();
  }

  pullFromGit() {
    this.isPulling = true;
    this.clearNotification();
    
    const repoUrl = 'https://github.com/Sai-Kushal-Nerella-WL/drools-rules-lite.git';
    this.apiService.pullFromRepo({ repoUrl, branch: 'main' }).subscribe({
      next: (response) => {
        console.log('Pull successful:', response);
        this.isPulling = false;
        this.showNotification('Successfully pulled latest changes from Git', 'success');
        this.loadFiles();
      },
      error: (error) => {
        console.error('Error pulling from Git:', error);
        this.isPulling = false;
        this.showNotification('Failed to pull from Git: ' + (error.error?.message || error.message), 'error');
      }
    });
  }

  showNotification(message: string, type: 'success' | 'error') {
    this.notification = { message, type };
    setTimeout(() => {
      this.clearNotification();
    }, 5000);
  }

  clearNotification() {
    this.notification = null;
  }
}
