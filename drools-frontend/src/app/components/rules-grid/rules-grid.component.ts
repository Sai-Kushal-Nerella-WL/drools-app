import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DecisionTableView, RuleRow } from '../../models/decision-table.model';
import { ApiService } from '../../services/api.service';

interface NotificationItem {
  id: string;
  message: string;
  type: 'success' | 'error';
  progress: number;
  timeoutId?: number;
}

@Component({
  selector: 'app-rules-grid',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="rules-grid-container" *ngIf="tableView">
      <div class="grid-header">
        <h3>{{ fileName }}</h3>
        <div class="actions">
          <button (click)="addRow()" class="btn btn-success">Add Row</button>
          <button (click)="save()" class="btn btn-primary" [disabled]="!hasChanges">Save</button>
          <button (click)="discardChanges()" class="btn btn-secondary" [disabled]="!hasChanges && !hasSavedChanges">Discard Changes</button>
          <button (click)="confirmPushToGit()" class="btn btn-warning" [disabled]="isPushing || hasChanges || !hasSavedChanges">
            <span *ngIf="isPushing" class="spinner"></span>
            {{ isPushing ? 'Pushing...' : 'Push to Git' }}
          </button>
        </div>
      </div>
      
      <div class="grid-wrapper">
        <table class="rules-table">
          <thead>
            <tr>
              <th *ngFor="let label of tableView.columnLabels">{{ label }}</th>
              <th>Actions</th>
            </tr>
            <tr class="template-row">
              <th *ngFor="let template of tableView.templateLabels" class="template-header">{{ template }}</th>
              <th class="template-header"></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of tableView.rows; let i = index">
              <td *ngFor="let label of tableView.columnLabels; let j = index">
                <input 
                  *ngIf="j === 0"
                  [(ngModel)]="row.name"
                  (ngModelChange)="markChanged()"
                  class="form-control"
                  placeholder="Rule name">
                <input 
                  *ngIf="j > 0"
                  [(ngModel)]="row.values[j-1]"
                  (ngModelChange)="markChanged()"
                  class="form-control"
                  [placeholder]="getPlaceholder(j-1)">
              </td>
              <td>
                <button (click)="deleteRow(i)" class="btn btn-danger btn-sm">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div *ngIf="tableView.rows.length === 0" class="no-data">
        No rules found. Click "Add Row" to create your first rule.
      </div>
    </div>
    
    <div *ngIf="!tableView" class="no-file-selected">
      Select an Excel file from the left panel to view and edit rules.
    </div>
    
    <!-- Confirmation Dialog -->
    <div *ngIf="showConfirmDialog" class="modal-overlay" (click)="cancelPush()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <h4>Confirm Push to Git</h4>
        <p>Are you sure you want to push changes to Git?</p>
        <p><strong>File:</strong> {{ fileName }}</p>
        <p><strong>Branch:</strong> {{ pendingBranch }}</p>
        <div class="modal-actions">
          <button (click)="cancelPush()" class="btn btn-secondary">Cancel</button>
          <button (click)="confirmPush()" class="btn btn-warning">Yes, Push</button>
        </div>
      </div>
    </div>
    
    <!-- Notification Stack -->
    <div class="notification-stack">
      <div *ngFor="let notif of notifications; trackBy: trackNotification" 
           class="notification" 
           [class]="notif.type"
           [style.animation-delay]="getAnimationDelay(notif) + 'ms'">
        {{ notif.message }}
        <button (click)="removeNotification(notif.id)" class="close-btn">&times;</button>
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="notif.progress"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .rules-grid-container {
      padding: 20px;
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    
    .grid-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #ddd;
    }
    
    .grid-header h3 {
      margin: 0;
      color: #333;
    }
    
    .actions {
      display: flex;
      gap: 10px;
    }
    
    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    
    .btn-success {
      background-color: #28a745;
      color: white;
    }
    
    .btn-primary {
      background-color: #007bff;
      color: white;
    }
    
    .btn-warning {
      background-color: #ffc107;
      color: #212529;
    }
    
    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }
    
    .btn-danger {
      background-color: #dc3545;
      color: white;
    }
    
    .btn-sm {
      padding: 4px 8px;
      font-size: 12px;
    }
    
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .btn:hover:not(:disabled) {
      opacity: 0.9;
    }
    
    .grid-wrapper {
      overflow: auto;
      flex: 1;
      min-height: 0;
    }
    
    .rules-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .rules-table th,
    .rules-table td {
      padding: 12px;
      text-align: left;
      border: 1px solid #ddd;
    }
    
    .rules-table th {
      background-color: #f8f9fa;
      font-weight: 600;
      position: sticky;
      top: 0;
    }
    
    .template-row {
      background-color: #e9ecef;
    }
    
    .template-header {
      font-size: 11px;
      font-weight: 400;
      font-style: italic;
      color: #6c757d;
      padding: 6px 12px;
      background-color: #e9ecef !important;
    }
    
    .form-control {
      width: 100%;
      max-width: 200px;
      padding: 6px 10px;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-size: 14px;
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
    }
    
    .form-control:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
    }
    
    .no-data,
    .no-file-selected {
      text-align: center;
      padding: 40px;
      color: #666;
      font-style: italic;
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
    
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    
    .modal-content {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      max-width: 400px;
      width: 90%;
    }
    
    .modal-content h4 {
      margin-top: 0;
      margin-bottom: 15px;
      color: #333;
    }
    
    .modal-content p {
      margin-bottom: 10px;
      color: #666;
    }
    
    .modal-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 20px;
    }
    
    .notification-stack {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: calc(100vh - 40px);
      overflow: hidden;
    }
    
    .notification {
      padding: 15px 20px 10px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      max-width: 400px;
      min-width: 300px;
      font-size: 15px;
      font-weight: 500;
      border-left: 4px solid;
      animation: slideIn 0.3s ease-out;
      position: relative;
      background: white;
    }
    
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    .notification.success {
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
      border-left-color: #28a745;
    }
    
    .notification.error {
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
      border-left-color: #dc3545;
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
      opacity: 0.7;
    }
    
    .close-btn:hover {
      opacity: 1;
    }
    
    .progress-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 3px;
      background-color: rgba(0, 0, 0, 0.1);
      border-radius: 0 0 8px 8px;
      overflow: hidden;
    }
    
    .progress-fill {
      height: 100%;
      background-color: currentColor;
      transition: width 100ms linear;
      opacity: 0.6;
    }
    
  `]
})
export class RulesGridComponent implements OnChanges {
  @Input() fileName: string | null = null;
  @Input() externalNotification: { message: string; type: 'success' | 'error' } | null = null;
  
  tableView: DecisionTableView | null = null;
  originalTableView: DecisionTableView | null = null;
  hasChanges = false;
  hasSavedChanges = false;
  isPushing = false;
  showConfirmDialog = false;
  pendingBranch = '';
  notifications: NotificationItem[] = [];

  constructor(private apiService: ApiService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['fileName'] && this.fileName) {
      this.loadTable();
    }
    if (changes['externalNotification'] && this.externalNotification) {
      this.showNotification(this.externalNotification.message, this.externalNotification.type);
    }
  }

  loadTable() {
    if (!this.fileName) return;
    
    this.apiService.openSheet(this.fileName).subscribe({
      next: (view) => {
        this.tableView = view;
        this.originalTableView = JSON.parse(JSON.stringify(view));
        this.hasChanges = false;
        this.hasSavedChanges = false;
      },
      error: (error) => {
        console.error('Error loading table:', error);
      }
    });
  }

  addRow() {
    if (!this.tableView) return;
    
    const newRow: RuleRow = {
      name: '',
      values: new Array(this.tableView.columnLabels.length - 1).fill(null)
    };
    
    this.tableView.rows.push(newRow);
    this.markChanged();
  }

  deleteRow(index: number) {
    if (!this.tableView) return;
    
    this.tableView.rows.splice(index, 1);
    this.markChanged();
  }

  markChanged() {
    this.hasChanges = true;
  }

  save() {
    if (!this.fileName || !this.tableView) return;
    
    this.apiService.saveSheet(this.fileName, this.tableView).subscribe({
      next: (response) => {
        console.log('Save successful:', response);
        this.hasChanges = false;
        this.hasSavedChanges = true;
        this.showNotification(response.message || 'Changes saved successfully', 'success');
      },
      error: (error) => {
        console.error('Error saving:', error);
        const errorMessage = error.error?.error || error.error?.message || error.message || 'Unknown error occurred';
        this.showNotification('Failed to save changes: ' + errorMessage, 'error');
      }
    });
  }

  confirmPushToGit() {
    if (!this.fileName) return;
    
    const timestamp = Date.now();
    this.pendingBranch = `devin/${timestamp}-rules-update`;
    this.showConfirmDialog = true;
  }

  cancelPush() {
    this.showConfirmDialog = false;
    this.pendingBranch = '';
  }

  confirmPush() {
    this.showConfirmDialog = false;
    this.pushToGit();
  }

  pushToGit() {
    if (!this.fileName) return;
    
    this.isPushing = true;
    
    const commitMessage = `Update rules in ${this.fileName}`;
    const repoUrl = 'https://github.com/Sai-Kushal-Nerella-WL/drools-rules-lite.git';
    
    this.apiService.pushToRepo({
      fileName: this.fileName,
      repoUrl,
      newBranch: this.pendingBranch,
      commitMessage
    }).subscribe({
      next: (response) => {
        console.log('Push successful:', response);
        this.isPushing = false;
        this.hasSavedChanges = false;
        this.showNotification(`Successfully pushed to Git! Branch: ${this.pendingBranch}`, 'success');
        
        this.apiService.createPullRequest({
          repoUrl,
          baseBranch: 'main',
          newBranch: this.pendingBranch,
          title: `Update Drools rules in ${this.fileName}`,
          body: `Automated update to decision table rules via Drools Rules Manager`
        }).subscribe({
          next: (prResponse) => {
            console.log('PR created:', prResponse);
          },
          error: (error) => {
            console.error('Error creating PR:', error);
          }
        });
      },
      error: (error) => {
        console.error('Error pushing to Git:', error);
        this.isPushing = false;
        this.showNotification('Failed to push to Git: ' + (error.error?.message || error.message), 'error');
      }
    });
  }

  showNotification(message: string, type: 'success' | 'error') {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const notification: NotificationItem = {
      id,
      message,
      type,
      progress: 100
    };

    this.notifications.push(notification);
    
    if (this.notifications.length > 3) {
      const removed = this.notifications.shift();
      if (removed?.timeoutId) {
        clearInterval(removed.timeoutId);
      }
    }

    this.startProgressCountdown(notification);
  }

  private startProgressCountdown(notification: NotificationItem) {
    const duration = 8000; // 8 seconds
    const interval = 100; // Update every 100ms
    const steps = duration / interval;
    const progressStep = 100 / steps;
    
    let currentStep = 0;
    
    const progressInterval = setInterval(() => {
      currentStep++;
      notification.progress = Math.max(0, 100 - (currentStep * progressStep));
      
      if (currentStep >= steps) {
        clearInterval(progressInterval);
        this.removeNotification(notification.id);
      }
    }, interval);
    
    notification.timeoutId = progressInterval as any;
  }

  removeNotification(id: string) {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      const notification = this.notifications[index];
      if (notification.timeoutId) {
        clearInterval(notification.timeoutId);
      }
      this.notifications.splice(index, 1);
    }
  }

  trackNotification(index: number, item: NotificationItem): string {
    return item.id;
  }

  getAnimationDelay(notification: NotificationItem): number {
    const index = this.notifications.findIndex(n => n.id === notification.id);
    return index * 100; // Stagger animations by 100ms
  }

  discardChanges() {
    if (!this.originalTableView) return;
    
    this.tableView = JSON.parse(JSON.stringify(this.originalTableView));
    this.hasChanges = false;
    this.hasSavedChanges = false;
    this.showNotification('Changes discarded successfully', 'success');
  }

  getPlaceholder(valueIndex: number): string {
    if (!this.tableView) return '';
    
    const columnLabel = this.tableView.columnLabels[valueIndex + 1];
    if (columnLabel?.includes('CONDITION')) {
      return 'Enter condition value';
    } else if (columnLabel?.includes('ACTION')) {
      return 'Enter action value';
    }
    return 'Enter value';
  }
}
