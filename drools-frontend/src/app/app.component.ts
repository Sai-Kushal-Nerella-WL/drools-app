import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileListComponent } from './components/file-list/file-list.component';
import { RulesGridComponent } from './components/rules-grid/rules-grid.component';
import { RepositorySetupComponent } from './components/repository-setup/repository-setup.component';
import { RepositoryConfigService } from './services/repository-config.service';
import { RepositoryConfig } from './models/repository-config.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FileListComponent, RulesGridComponent, RepositorySetupComponent],
  template: `
    <app-repository-setup 
      *ngIf="!isConfigured"
      (configurationComplete)="onConfigurationComplete($event)">
    </app-repository-setup>
    
    <div class="app-container" *ngIf="isConfigured">
      <div class="left-panel">
        <app-file-list 
          (fileSelected)="onFileSelected($event)"
          (notificationRequested)="onNotificationRequested($event)">
        </app-file-list>
      </div>
      <div class="right-panel">
        <app-rules-grid 
          [fileName]="selectedFileName"
          [externalNotification]="externalNotification">
        </app-rules-grid>
      </div>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
export class AppComponent implements OnInit {
  selectedFileName: string | null = null;
  externalNotification: { message: string; type: 'success' | 'error' } | null = null;
  isConfigured = false;
  
  constructor(private repositoryConfigService: RepositoryConfigService) {}

  ngOnInit() {
    this.isConfigured = this.repositoryConfigService.isConfigured();
    
    this.repositoryConfigService.getConfig().subscribe((config: RepositoryConfig | null) => {
      this.isConfigured = this.repositoryConfigService.isConfigured();
    });
  }

  onFileSelected(fileName: string) {
    this.selectedFileName = fileName;
  }

  onNotificationRequested(notification: { message: string; type: 'success' | 'error' }) {
    this.externalNotification = notification;
    setTimeout(() => {
      this.externalNotification = null;
    }, 8000);
  }

  onConfigurationComplete(config: RepositoryConfig) {
    this.isConfigured = true;
  }
}
