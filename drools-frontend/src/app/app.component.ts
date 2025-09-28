import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { FileListComponent } from './components/file-list/file-list.component';
import { RulesGridComponent } from './components/rules-grid/rules-grid.component';
import { RepoConfigService } from './services/repo-config.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, FileListComponent, RulesGridComponent],
  template: `
    <div class="app-container">
      <div class="app-header">
        <h1>Drools Rules Manager</h1>
        <div class="header-actions">
          <button 
            (click)="openRepoConfig()" 
            class="btn btn-config"
            [class.btn-warning]="!isRepoConfigured"
            [class.btn-success]="isRepoConfigured">
            {{ isRepoConfigured ? 'Repository Configured' : 'Configure Repository' }}
          </button>
        </div>
      </div>
      
      <router-outlet></router-outlet>
      
      <div class="main-content" *ngIf="!isRouterActive">
        <div class="left-panel">
          <app-file-list (fileSelected)="onFileSelected($event)"></app-file-list>
        </div>
        <div class="right-panel">
          <app-rules-grid [fileName]="selectedFileName"></app-rules-grid>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .app-container {
      height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
    }
    
    .app-header {
      background: #f8f9fa;
      border-bottom: 1px solid #dee2e6;
      padding: 15px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .app-header h1 {
      margin: 0;
      color: #333;
      font-size: 24px;
    }
    
    .header-actions {
      display: flex;
      gap: 10px;
    }
    
    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
    }
    
    .btn-config {
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
    
    .btn:hover {
      opacity: 0.9;
    }
    
    .main-content {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
    
    .left-panel {
      width: 300px;
      min-width: 250px;
      max-width: 400px;
      resize: horizontal;
      overflow: auto;
    }
    
    .right-panel {
      flex: 1;
      overflow: hidden;
    }
  `]
})
export class AppComponent {
  selectedFileName: string | null = null;
  isRepoConfigured = false;
  isRouterActive = false;

  constructor(
    private router: Router,
    private repoConfigService: RepoConfigService
  ) {
    this.repoConfigService.repoConfig$.subscribe(config => {
      this.isRepoConfigured = !!config;
    });

    this.router.events.subscribe(() => {
      this.isRouterActive = this.router.url !== '/';
    });
  }

  onFileSelected(fileName: string) {
    this.selectedFileName = fileName;
  }

  openRepoConfig() {
    this.router.navigate(['/repo-config']);
  }
}
