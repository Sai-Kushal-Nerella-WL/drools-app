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
        <button (click)="pullFromGit()" class="btn btn-primary">Pull from Git</button>
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
  `]
})
export class FileListComponent implements OnInit {
  files: string[] = [];
  selectedFile: string | null = null;
  
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
    const repoUrl = 'https://github.com/Sai-Kushal-Nerella-WL/drools-rules-lite.git';
    this.apiService.pullFromRepo({ repoUrl, branch: 'main' }).subscribe({
      next: (response) => {
        console.log('Pull successful:', response);
        this.loadFiles();
      },
      error: (error) => {
        console.error('Error pulling from Git:', error);
      }
    });
  }
}
