import { Component } from '@angular/core';
import { FileListComponent } from './components/file-list/file-list.component';
import { RulesGridComponent } from './components/rules-grid/rules-grid.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FileListComponent, RulesGridComponent],
  template: `
    <div class="app-container">
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
export class AppComponent {
  selectedFileName: string | null = null;
  externalNotification: { message: string; type: 'success' | 'error' } | null = null;

  onFileSelected(fileName: string) {
    this.selectedFileName = fileName;
  }

  onNotificationRequested(notification: { message: string; type: 'success' | 'error' }) {
    this.externalNotification = notification;
    setTimeout(() => {
      this.externalNotification = null;
    }, 8000);
  }
}
