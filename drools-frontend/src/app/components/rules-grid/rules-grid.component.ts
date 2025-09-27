import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DecisionTableView, RuleRow } from '../../models/decision-table.model';
import { ApiService } from '../../services/api.service';

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
          <button (click)="discardChanges()" class="btn btn-secondary" [disabled]="!hasChanges">Discard Changes</button>
          <button (click)="confirmPushToGit()" class="btn btn-warning" [disabled]="isPushing || hasChanges">
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
    
    <!-- Notification -->
    <div *ngIf="notification" class="notification" [class]="notification.type">
      {{ notification.message }}
      <button (click)="clearNotification()" class="close-btn">&times;</button>
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
      padding: 6px 10px;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-size: 14px;
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
    
    .notification {
      margin-top: 15px;
      padding: 15px 20px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      max-width: 400px;
      font-size: 14px;
      position: relative;
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
export class RulesGridComponent implements OnChanges {
  @Input() fileName: string | null = null;
  
  tableView: DecisionTableView | null = null;
  originalTableView: DecisionTableView | null = null;
  hasChanges = false;
  isPushing = false;
  showConfirmDialog = false;
  pendingBranch = '';
  notification: { message: string; type: 'success' | 'error' } | null = null;

  constructor(private apiService: ApiService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['fileName'] && this.fileName) {
      this.loadTable();
    }
  }

  loadTable() {
    if (!this.fileName) return;
    
    this.apiService.openSheet(this.fileName).subscribe({
      next: (view) => {
        this.tableView = view;
        this.originalTableView = JSON.parse(JSON.stringify(view));
        this.hasChanges = false;
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
      },
      error: (error) => {
        console.error('Error saving:', error);
      }
    });
  }

  confirmPushToGit() {
    if (!this.fileName) return;
    
    if (this.hasChanges) {
      this.showNotification('Please save your changes before pushing to Git', 'error');
      return;
    }
    
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
    this.clearNotification();
    
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
    this.notification = { message, type };
    setTimeout(() => {
      this.clearNotification();
    }, 8000);
  }

  clearNotification() {
    this.notification = null;
  }

  discardChanges() {
    if (!this.originalTableView) return;
    
    this.tableView = JSON.parse(JSON.stringify(this.originalTableView));
    this.hasChanges = false;
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
