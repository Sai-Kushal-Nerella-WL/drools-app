import { Component, Input, OnChanges, SimpleChanges, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DecisionTableView, RuleRow } from '../../models/decision-table.model';
import { ApiService } from '../../services/api.service';
import { RepositoryConfigService } from '../../services/repository-config.service';

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
          <button (click)="showAddColumnModal()" class="btn btn-info">Add Column</button>
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
              <th *ngFor="let label of tableView.columnLabels; let i = index">
                {{ label }}
                <button *ngIf="i > 0" (click)="confirmDeleteColumn(i)" class="btn-delete-column" title="Delete column">×</button>
              </th>
              <th>Events</th>
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
        <p><strong>Repository:</strong> {{ getRepositoryDisplayName() }}</p>
        <div class="modal-actions">
          <button (click)="cancelPush()" class="btn btn-secondary">Cancel</button>
          <button (click)="confirmPush()" class="btn btn-warning">Yes, Push</button>
        </div>
      </div>
    </div>

    <!-- Add Column Modal -->
    <div *ngIf="showAddColumnModalFlag" class="modal-overlay" (click)="hideAddColumnModal()">
      <div class="modal-content add-column-modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h4>Add New Column</h4>
          <button class="modal-close" (click)="hideAddColumnModal()">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Column Type:</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" name="columnType" value="CONDITION" [(ngModel)]="newColumnType">
                Condition
              </label>
              <label class="radio-label">
                <input type="radio" name="columnType" value="ACTION" [(ngModel)]="newColumnType">
                Action
              </label>
            </div>
          </div>
          <div class="form-group">
            <label for="columnName">Column Name:</label>
            <input type="text" id="columnName" [(ngModel)]="newColumnName" placeholder="Enter column name" class="form-control">
          </div>
          <div class="form-group">
            <label for="templateValue">Template Value:</label>
            <input type="text" id="templateValue" [(ngModel)]="newColumnTemplate"
                   [placeholder]="getTemplatePlaceholder()" class="form-control">
          </div>
        </div>
        <div class="modal-footer">
          <button (click)="hideAddColumnModal()" class="btn btn-secondary">Cancel</button>
          <button (click)="addColumn()" class="btn btn-primary" [disabled]="!isAddColumnFormValid()">Add Column</button>
        </div>
      </div>
    </div>

    <!-- Delete Column Confirmation Modal -->
    <div *ngIf="showDeleteColumnModalFlag" class="modal-overlay" (click)="hideDeleteColumnModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h4>Confirm Delete Column</h4>
          <button class="modal-close" (click)="hideDeleteColumnModal()">×</button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete the column "{{ getColumnToDelete() }}"?</p>
          <p class="warning-text">This action cannot be undone.</p>
        </div>
        <div class="modal-footer">
          <button (click)="hideDeleteColumnModal()" class="btn btn-secondary">Cancel</button>
          <button (click)="deleteColumn()" class="btn btn-danger">Delete Column</button>
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
      overflow: visible;
      display: flex;
      flex-direction: column;
      background: #ffffff;
      border-radius: 12px;
      box-sizing: border-box;
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
      background-color: #f3c623;
      color: #1b1b1b;
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
      overflow-x: auto !important;
      overflow-y: auto !important;
      -webkit-overflow-scrolling: touch;
      flex: 1;
      min-height: 0;
      position: relative;
      border: 1px solid #ddd;
      width: 100% !important;
      max-width: 100% !important;
      height: auto !important;
      max-height: calc(100vh - 220px) !important;
      display: block !important;
      scroll-behavior: smooth;
    }

    @media (max-height: 800px) {
      .grid-wrapper {
        max-height: calc(100vh - 180px) !important;
      }
    }
    @media (max-height: 600px) {
      .grid-wrapper {
        max-height: calc(100vh - 160px) !important;
      }
    }

    ::ng-deep .grid-wrapper {
      overflow-x: auto !important;
      overflow-y: auto !important;
      width: 100% !important;
      max-width: 100% !important;
      height: 400px !important;
      display: block !important;
    }

    /* More aggressive CSS to override any conflicting styles */
    ::ng-deep .rules-grid-container {
      overflow: visible !important;
      overflow-x: visible !important;
      overflow-y: visible !important;
    }

    ::ng-deep .rules-grid-container .grid-wrapper {
      overflow-x: auto !important;
      overflow-y: auto !important;
      overflow: auto !important;
      width: 100% !important;
      max-width: 100% !important;
    }

    /* Even more aggressive selectors to override conflicting styles */
    ::ng-deep app-rules-grid .rules-grid-container .grid-wrapper {
      overflow-x: auto !important;
      overflow-y: auto !important;
    }

    ::ng-deep .right-panel app-rules-grid .rules-grid-container .grid-wrapper {
      overflow-x: auto !important;
      overflow-y: auto !important;
    }

    ::ng-deep .rules-grid-container .grid-wrapper .rules-table {
      table-layout: fixed !important;
      width: max-content !important;
    }

    /* Target parent containers that might be setting overflow: hidden */
    ::ng-deep .right-panel {
      overflow: visible !important;
      overflow-x: visible !important;
    }

    ::ng-deep app-rules-grid {
      overflow: visible !important;
      overflow-x: visible !important;
    }

    ::ng-deep .rules-table {
      border-collapse: collapse;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      table-layout: fixed !important;
      overflow: visible !important;
      width: max-content !important;
      min-width: 100% !important;
    }

    ::ng-deep .rules-table th,
    ::ng-deep .rules-table td {
      padding: 12px;
      text-align: left;
      border: 1px solid #ddd;
      width: 200px !important;
      min-width: 200px !important;
      max-width: 200px !important;
      white-space: normal !important;
      word-wrap: break-word !important;
      overflow-wrap: break-word !important;
      vertical-align: top !important;
    }

    .rules-table th:last-child,
    .rules-table td:last-child {
      width: 100px !important;
      max-width: 100px !important;
      min-width: 100px !important;
      text-align: center !important;
      position: sticky !important;
      right: 0 !important;
      background-color: white !important;
      z-index: 10 !important;
    }

    .rules-table th:last-child {
      padding: 8px 12px !important;
      background-color: #f8f9fa !important;
      font-weight: 600;
      text-align: center;
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
      white-space: normal !important;
      word-wrap: break-word !important;
      overflow-wrap: break-word !important;
      line-height: 1.3 !important;
      max-height: 80px !important;
      overflow-y: auto !important;
      width: 200px !important;
      min-width: 200px !important;
      max-width: 200px !important;
    }

    .form-control {
      width: 100%;
      min-width: 120px;
      max-width: 100%;
      padding: 6px 10px;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-size: 14px;
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
      box-sizing: border-box;
    }

    .form-control:focus {
      outline: none;
      border-color: #f3c623;
      box-shadow: 0 0 0 2px rgba(243,198,35,0.25);
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
      position: fixed !important;
      bottom: 20px !important;
      right: 20px !important;
      z-index: 99999 !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 10px !important;
      max-height: calc(100vh - 40px) !important;
      overflow: visible !important;
      width: min(300px, calc(100vw - 40px)) !important;
      max-width: calc(100vw - 40px) !important;
      min-width: 200px !important;
      min-height: 20px !important;
      pointer-events: auto !important;
      box-sizing: border-box !important;
    }

    .notification {
      padding: 12px 16px 8px 16px !important;
      border-radius: 10px !important;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15) !important;
      width: 100% !important;
      max-width: 100% !important;
      min-width: 200px !important;
      min-height: 50px !important;
      font-size: 13px !important;
      font-weight: 500 !important;
      border-left: 4px solid !important;
      animation: slideIn 0.3s ease-out !important;
      position: relative !important;
      background: #ffffff !important;
      flex-shrink: 0 !important;
      display: block !important;
      word-wrap: break-word !important;
      overflow-wrap: break-word !important;
      box-sizing: border-box !important;
      margin: 0 !important;
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

    /* Smooth scroll and hide scrollbars for the grid wrapper */
    .grid-wrapper {
      -ms-overflow-style: none; /* IE/Edge */
      scrollbar-width: none; /* Firefox */
      scroll-behavior: smooth;
    }
    .grid-wrapper::-webkit-scrollbar {
      width: 0;
      height: 0;
      background: transparent;
    }
    /* Make grid fill the right panel and keep content inside viewport */
    .rules-grid-container {
      height: 100%;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .grid-wrapper {
      flex: 1;
      height: auto !important;
      max-height: 100% !important;
      overflow: auto !important;
    }

    .notification.success {
      background-color: #fff4cc !important;
      color: #1b1b1b !important;
      border: 1px solid #e6dfcf !important;
      border-left-color: #f3c623 !important;
    }

    .notification.error {
      background-color: #fde8ea !important;
      color: #8a1c24 !important;
      border: 1px solid #f3c2c7 !important;
      border-left-color: #dc3545 !important;
    .notification.success .progress-fill {
      background-color: #f3c623 !important;
    }
    .notification.error .progress-fill {
      background-color: #dc3545 !important;
    }

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

    .btn-delete-column {
      background: #dc3545;
      color: white;
      border: none;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      font-size: 14px;
      line-height: 1;
      cursor: pointer;
      margin-left: 8px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .btn-delete-column:hover {
      background-color: #c82333;
      transform: scale(1.1);
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }

    .btn-delete-column:active {
      transform: scale(0.95);
    }

    .add-column-modal {
      max-width: 500px;
      width: 90%;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #dee2e6;
    }

    .modal-header h4 {
      margin: 0;
      color: #333;
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #999;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal-close:hover {
      color: #333;
    }

    .modal-body {
      padding: 20px;
    }

    .modal-footer {
      padding: 20px;
      border-top: 1px solid #dee2e6;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #333;
    }

    .radio-group {
      display: flex;
      gap: 20px;
    }

    .radio-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-weight: normal;
    }

    .radio-label input[type="radio"] {
      margin: 0;
    }

    .warning-text {
      color: #dc3545;
      font-style: italic;
      margin-top: 10px;
    }

    .btn-info {
      background-color: #17a2b8;
      color: white;
    }

  `]
})
export class RulesGridComponent implements OnChanges, AfterViewInit, OnDestroy {
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

  showAddColumnModalFlag = false;
  newColumnType: 'CONDITION' | 'ACTION' = 'CONDITION';
  newColumnName = '';
  newColumnTemplate = '';

  showDeleteColumnModalFlag = false;
  columnToDeleteIndex = -1;

  constructor(
    private apiService: ApiService,
    private repositoryConfigService: RepositoryConfigService,
    private router: Router
  ) {}
  
  private wheelHandler?: (e: WheelEvent) => void;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['fileName'] && this.fileName) {
      this.loadTable();
    }
    if (changes['externalNotification'] && this.externalNotification) {
      this.showNotification(this.externalNotification.message, this.externalNotification.type);
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.applyDynamicScrollingStyles();
      setTimeout(() => this.bindWheelToHorizontal(), 150);
    }, 100);
  }

  private applyDynamicScrollingStyles() {
    const attempts = [0, 200, 500, 1000];

    attempts.forEach(delay => {
      setTimeout(() => {
        this.forceDynamicScrollingStyles();
      }, delay);
    });
  }

  private forceDynamicScrollingStyles() {
    const table = document.querySelector('app-rules-grid table') as HTMLTableElement ||
                  document.querySelector('table') as HTMLTableElement;

    let wrapper = document.querySelector('app-rules-grid .grid-wrapper') as HTMLElement ||
                  document.querySelector('.grid-wrapper') as HTMLElement ||
                  document.querySelector('app-rules-grid > div') as HTMLElement;

    if (table && !wrapper) {
      wrapper = document.createElement('div');
      wrapper.className = 'grid-wrapper';
      table.parentNode?.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    }

    if (table && wrapper) {
      console.log('Applying dynamic scrolling styles to table and wrapper');

      wrapper.style.setProperty('overflow-x', 'auto', 'important');
      wrapper.style.setProperty('overflow-y', 'auto', 'important');
      wrapper.style.setProperty('width', '100%', 'important');
      wrapper.style.setProperty('max-width', '100%', 'important');
      wrapper.style.setProperty('height', '400px', 'important');
      wrapper.style.setProperty('display', 'block', 'important');
      wrapper.style.setProperty('position', 'relative', 'important');

      table.style.setProperty('table-layout', 'fixed', 'important');
      table.style.setProperty('width', 'max-content', 'important');
      table.style.setProperty('min-width', '100%', 'important');
      table.style.setProperty('border-collapse', 'collapse', 'important');

      const cells = table.querySelectorAll('th, td');
      cells.forEach((cell, index) => {
        const htmlCell = cell as HTMLElement;
        htmlCell.style.setProperty('width', '260px', 'important');
        htmlCell.style.setProperty('min-width', '260px', 'important');
        htmlCell.style.setProperty('max-width', '260px', 'important');
        htmlCell.style.setProperty('white-space', 'nowrap', 'important');
        htmlCell.style.setProperty('word-wrap', 'normal', 'important');
        htmlCell.style.setProperty('overflow-wrap', 'normal', 'important');
        htmlCell.style.setProperty('padding', '12px', 'important');
        htmlCell.style.setProperty('border', '1px solid #ddd', 'important');
        htmlCell.style.setProperty('vertical-align', 'top', 'important');
      });

      const eventsCells = table.querySelectorAll('th:last-child, td:last-child');
      eventsCells.forEach(cell => {
        const htmlCell = cell as HTMLElement;
        htmlCell.style.setProperty('position', 'sticky', 'important');
        htmlCell.style.setProperty('right', '0', 'important');
        htmlCell.style.setProperty('background', 'white', 'important');
        htmlCell.style.setProperty('z-index', '10', 'important');
        htmlCell.style.setProperty('box-shadow', '-2px 0 4px rgba(0,0,0,0.1)', 'important');
      });

      console.log('Dynamic scrolling styles applied successfully');
      console.log('Table width:', table.offsetWidth, 'Wrapper width:', wrapper.offsetWidth);
      console.log('Wrapper overflow-x:', window.getComputedStyle(wrapper).overflowX);
    } else {
      console.log('Could not find table or wrapper elements for dynamic scrolling');
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
        setTimeout(() => {
          this.applyDynamicScrollingStyles();
        }, 100);
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

    const config = this.repositoryConfigService.getCurrentConfig();
    if (!config) {
      this.showNotification('Repository not configured', 'error');
      return;
    }

    this.pendingBranch = 'Generating branch name...';
    this.showConfirmDialog = true;

    this.apiService.generateBranchName({
      fileName: this.fileName,
      repoUrl: config.repoUrl,
      newBranch: '',
      commitMessage: ''
    }).subscribe({
      next: (response) => {
        this.pendingBranch = response.branchName;
      },
      error: (error) => {
        console.error('Error generating branch name:', error);
        this.pendingBranch = 'Error generating branch name';
      }
    });
  }


  cancelPush() {
    this.showConfirmDialog = false;
    this.pendingBranch = '';
  }

  ngOnDestroy() {
    const wrapper = document.querySelector('app-rules-grid .grid-wrapper') as HTMLElement
                 || document.querySelector('.grid-wrapper') as HTMLElement;
    if (wrapper && this.wheelHandler) {
      wrapper.removeEventListener('wheel', this.wheelHandler as any);
    }
  }

  private bindWheelToHorizontal() {
    const wrapper = document.querySelector('app-rules-grid .grid-wrapper') as HTMLElement
                 || document.querySelector('.grid-wrapper') as HTMLElement;
    if (!wrapper) return;

    if (this.wheelHandler) {
      try {
        wrapper.removeEventListener('wheel', this.wheelHandler as any);
      } catch {}
    }

    this.wheelHandler = (e: WheelEvent) => {
      const horizDelta = e.deltaX || (e.shiftKey ? e.deltaY : 0);
      const effectiveDeltaX = horizDelta !== 0 ? horizDelta : (e.deltaY !== 0 ? e.deltaY : 0);

      if (effectiveDeltaX !== 0) {
        e.preventDefault();
        wrapper.scrollLeft += effectiveDeltaX;
      }
    };

    wrapper.addEventListener('wheel', this.wheelHandler as any, { passive: false });
  }


  confirmPush() {
    this.showConfirmDialog = false;
    this.pushToGit();
  }

  pushToGit() {
    if (!this.fileName) return;

    const config = this.repositoryConfigService.getCurrentConfig();
    if (!config) {
      this.showNotification('Repository not configured', 'error');
      return;
    }

    this.isPushing = true;

    const commitMessage = `Update rules in ${this.fileName}`;

    this.apiService.pushToRepo({
      fileName: this.fileName,
      repoUrl: config.repoUrl,
      newBranch: this.pendingBranch,
      commitMessage
    }).subscribe({
      next: (response) => {
        console.log('Push successful:', response);
        this.isPushing = false;
        this.hasSavedChanges = false;
        const branchName = response.branchName || this.pendingBranch;
        this.showNotification(response.message || `Successfully pushed to Git! Branch: ${branchName}`, 'success');

        this.apiService.createPullRequest({
          repoUrl: config.repoUrl,
          baseBranch: config.branch,
          newBranch: branchName,
          title: `Update Drools rules in ${this.fileName}`,
          body: `Automated update to decision table rules via Drools Rules Manager`
        }).subscribe({
          next: (prResponse) => {
            console.log('PR created:', prResponse);
            this.showNotification(prResponse.message || 'Pull request created successfully!', 'success');

            this.apiService.pullFromRepo({
              repoUrl: config.repoUrl,
              branch: 'main'
            }).subscribe({
              next: (pullResponse) => {
                console.log('Auto-sync to main completed:', pullResponse);
                this.showNotification('Local files synced to main branch', 'success');
                this.loadTable();

                setTimeout(() => {
                  this.router.navigate(['/']);
                }, 1500);
              },
              error: (pullError) => {
                console.error('Error syncing to main:', pullError);
                this.showNotification('Push successful but failed to sync to main branch', 'error');
              }
            });
          },
          error: (error) => {
            console.error('Error creating PR:', error);
            this.showNotification('Push successful but failed to create PR: ' + (error.error?.error || error.error?.message || error.message), 'error');
          }
        });
      },
      error: (error) => {
        console.error('Error pushing to Git:', error);
        this.isPushing = false;
        this.showNotification('Failed to push to Git: ' + (error.error?.error || error.error?.message || error.message), 'error');
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

  getRepositoryDisplayName(): string {
    const config = this.repositoryConfigService.getCurrentConfig();
    return config?.displayName || config?.repoUrl || 'Unknown Repository';
  }

  showAddColumnModal(): void {
    this.showAddColumnModalFlag = true;
    this.newColumnType = 'CONDITION';
    this.newColumnName = '';
    this.newColumnTemplate = '';
  }

  hideAddColumnModal(): void {
    this.showAddColumnModalFlag = false;
  }

  isAddColumnFormValid(): boolean {
    return this.newColumnName.trim() !== '' && this.newColumnTemplate.trim() !== '';
  }

  getTemplatePlaceholder(): string {
    if (this.newColumnType === 'CONDITION') {
      return 'e.g., customer.getAge() >= $param, order.getAmount() > $param';
    } else {
      return 'e.g., customer.setDiscount($param);, order.setStatus("$param");';
    }
  }

  addColumn(): void {
    if (!this.isAddColumnFormValid()) {
      return;
    }

    this.apiService.addColumn(this.fileName!, this.newColumnType, this.newColumnName, this.newColumnTemplate)
      .subscribe({
        next: (response) => {
          this.showNotification(response.message, 'success');
          this.hideAddColumnModal();
          this.loadTable();
        },
        error: (error) => {
          console.error('Error adding column:', error);
          const errorMessage = error.error?.error || 'Failed to add column';
          this.showNotification(errorMessage, 'error');
        }
      });
  }

  confirmDeleteColumn(columnIndex: number): void {
    this.columnToDeleteIndex = columnIndex;
    this.showDeleteColumnModalFlag = true;
  }

  hideDeleteColumnModal(): void {
    this.showDeleteColumnModalFlag = false;
    this.columnToDeleteIndex = -1;
  }

  getColumnToDelete(): string {
    if (this.tableView && this.columnToDeleteIndex >= 0 && this.columnToDeleteIndex < this.tableView.columnLabels.length) {
      return this.tableView.columnLabels[this.columnToDeleteIndex];
    }
    return '';
  }

  deleteColumn(): void {
    if (this.columnToDeleteIndex < 0) {
      return;
    }

    this.apiService.deleteColumn(this.fileName!, this.columnToDeleteIndex)
      .subscribe({
        next: (response) => {
          this.showNotification(response.message, 'success');
          this.hideDeleteColumnModal();
          this.loadTable();
        },
        error: (error) => {
          console.error('Error deleting column:', error);
          const errorMessage = error.error?.error || 'Failed to delete column';
          this.showNotification(errorMessage, 'error');
        }
      });
  }
}
