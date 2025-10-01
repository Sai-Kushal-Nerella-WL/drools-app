import { Component, OnInit, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FileListComponent } from './components/file-list/file-list.component';
import { RulesGridComponent } from './components/rules-grid/rules-grid.component';
import { RepositorySetupComponent } from './components/repository-setup/repository-setup.component';
import { RepositoryConfigService } from './services/repository-config.service';
import { RepositoryConfig } from './models/repository-config.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FileListComponent, RulesGridComponent, RepositorySetupComponent],
  template: `
    <app-repository-setup
      *ngIf="!isConfigured"
      (configurationComplete)="onConfigurationComplete($event)">
    </app-repository-setup>

    <div class="app-container" *ngIf="isConfigured">
      <div class="left-panel">
        <app-file-list
          (fileSelected)="onFileSelected($event)"
          (notificationRequested)="onNotificationRequested($event)"
          (repositoryChangeRequested)="onRepositoryChangeRequested()"
          [repositoryConfigurationChanged]="repositoryConfigurationChanged">
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
    :host {
      display: block;
      width: 100%;
      height: 100vh;
      overflow: hidden;
    }

    .app-container {
      display: flex;
      height: 100vh;
      width: 100vw;
      max-width: 100vw;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
      box-sizing: border-box;
      background: #f3c623;
      gap: 12px;
      padding: 12px;
    }

    .left-panel {
      width: min(300px, 25vw);
      min-width: min(250px, 20vw);
      max-width: min(400px, 30vw);
      resize: horizontal;
      overflow: auto;
      flex-shrink: 0;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
      border: 1px solid #e6dfcf;
    }
    .left-panel {
      max-height: calc(100vh - 24px);
      overflow: hidden;
    }


    .right-panel {
      flex: 1;
      overflow-y: auto;
      overflow-x: visible;
      min-width: 0;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
      border: 1px solid #e6dfcf;
    }
    /* Smooth scrolling globally within the app container */
    :host, .app-container, .left-panel, .right-panel {
      scroll-behavior: smooth;
    }

    /* Hide scrollbars cross-browser while preserving scroll */
    .app-container,
    .left-panel,
    .right-panel {
      -ms-overflow-style: none; /* IE/Edge */
      scrollbar-width: none; /* Firefox */
    }
    .app-container::-webkit-scrollbar,
    .left-panel::-webkit-scrollbar,
    .right-panel::-webkit-scrollbar {
      width: 0;
      height: 0;
      background: transparent;
    }

    /* Cap right panel height to viewport and let inner content scroll */
    .right-panel {
      display: flex;
      flex-direction: column;
      max-height: calc(100vh - 24px);
      overflow: hidden;
    }

  `]
})
export class AppComponent implements OnInit {
  selectedFileName: string | null = null;
  externalNotification: { message: string; type: 'success' | 'error' } | null = null;
  isConfigured = false;
  repositoryConfigurationChanged = new EventEmitter<void>();
  recentFilesLoaded = new EventEmitter<void>();

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
    this.repositoryConfigurationChanged.emit();
  }

  onRepositoryChangeRequested() {
    this.isConfigured = false;
    this.selectedFileName = null;
  }

  onRecentFilesLoaded() {
    this.recentFilesLoaded.emit();
  }
}
