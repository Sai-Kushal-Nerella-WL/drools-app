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
          <button (click)="pushToGit()" class="btn btn-warning">Push to Git</button>
        </div>
      </div>
      
      <div class="grid-wrapper">
        <table class="rules-table">
          <thead>
            <tr>
              <th *ngFor="let label of tableView.columnLabels">{{ label }}</th>
              <th>Actions</th>
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
  `,
  styles: [`
    .rules-grid-container {
      padding: 20px;
      height: 100vh;
      overflow: auto;
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
      overflow-x: auto;
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
  `]
})
export class RulesGridComponent implements OnChanges {
  @Input() fileName: string | null = null;
  
  tableView: DecisionTableView | null = null;
  hasChanges = false;

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

  pushToGit() {
    if (!this.fileName) return;
    
    const timestamp = Date.now();
    const newBranch = `devin/${timestamp}-rules-update`;
    const commitMessage = `Update rules in ${this.fileName}`;
    const repoUrl = 'https://github.com/Sai-Kushal-Nerella-WL/drools-rules-lite.git';
    
    this.apiService.pushToRepo({
      fileName: this.fileName,
      repoUrl,
      newBranch,
      commitMessage
    }).subscribe({
      next: (response) => {
        console.log('Push successful:', response);
        
        this.apiService.createPullRequest({
          repoUrl,
          baseBranch: 'main',
          newBranch,
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
      }
    });
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
