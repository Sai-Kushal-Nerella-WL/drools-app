import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { RepoConfigService } from '../../services/repo-config.service';
import { RepoConfig, RepoValidationRequest, ValidationResult, ConnectionResult, FolderDetectionResult } from '../../models/decision-table.model';

@Component({
  selector: 'app-repo-config',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="repo-config-container">
      <div class="config-header">
        <h2>Repository Configuration</h2>
        <p>Configure your Git repository for Drools rules management</p>
      </div>

      <form [formGroup]="configForm" (ngSubmit)="onSubmit()" class="config-form">
        <div class="form-group">
          <label for="repoUrl">Repository URL *</label>
          <input 
            id="repoUrl"
            type="url" 
            formControlName="repoUrl" 
            class="form-control"
            [class.is-invalid]="configForm.get('repoUrl')?.invalid && configForm.get('repoUrl')?.touched"
            placeholder="https://github.com/Sai-Kushal-Nerella-WL/drools-rules-lite">
          <div class="invalid-feedback" *ngIf="configForm.get('repoUrl')?.invalid && configForm.get('repoUrl')?.touched">
            Please enter a valid repository URL
          </div>
        </div>

        <div class="form-group">
          <label for="branch">Branch *</label>
          <input 
            id="branch"
            type="text" 
            formControlName="branch" 
            class="form-control"
            [class.is-invalid]="configForm.get('branch')?.invalid && configForm.get('branch')?.touched"
            placeholder="main">
          <div class="invalid-feedback" *ngIf="configForm.get('branch')?.invalid && configForm.get('branch')?.touched">
            Branch name is required
          </div>
        </div>

        <div class="credentials-section">
          <h4>Credentials (for private repositories)</h4>
          <div class="form-group">
            <label for="username">Username</label>
            <input 
              id="username"
              type="text" 
              formControlName="username" 
              class="form-control"
              placeholder="Git username">
          </div>

          <div class="form-group password-field">
            <label for="password">Password/Token</label>
            <input 
              id="password"
              type="password" 
              formControlName="password" 
              class="form-control"
              placeholder="Git password or personal access token">
          </div>
        </div>

        <div class="validation-section">
          <div class="validation-actions">
            <button 
              type="button" 
              (click)="testConnection()" 
              [disabled]="!configForm.get('repoUrl')?.value || isTestingConnection"
              class="btn btn-secondary">
              <span *ngIf="isTestingConnection" class="spinner"></span>
              {{ isTestingConnection ? 'Testing...' : 'Test Connection' }}
            </button>

            <button 
              type="button" 
              (click)="detectFolders()" 
              [disabled]="!isConnectionValid || isDetectingFolders"
              class="btn btn-info">
              <span *ngIf="isDetectingFolders" class="spinner"></span>
              {{ isDetectingFolders ? 'Detecting...' : 'Detect Folders' }}
            </button>
          </div>

          <div class="validation-status" *ngIf="validationMessage">
            <div [class]="'alert alert-' + (isConnectionValid ? 'success' : 'danger')">
              {{ validationMessage }}
            </div>
          </div>

          <div class="detected-folders" *ngIf="detectedFolders.length > 0">
            <h5>Detected Folders with Excel Files:</h5>
            <div class="folder-list">
              <div 
                *ngFor="let folder of detectedFolders" 
                class="folder-item"
                [class.selected]="selectedFolder === folder"
                (click)="selectFolder(folder)">
                {{ folder || 'Root directory' }}
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button 
            type="button" 
            (click)="goBack()" 
            class="btn btn-secondary">
            Cancel
          </button>
          <button 
            type="submit" 
            [disabled]="!configForm.valid || !isConnectionValid"
            class="btn btn-primary">
            Configure Repository
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .repo-config-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .config-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .config-header h2 {
      color: #333;
      margin-bottom: 10px;
    }

    .config-header p {
      color: #666;
      margin: 0;
    }

    .config-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group label {
      font-weight: 600;
      margin-bottom: 5px;
      color: #333;
    }

    .form-control {
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      transition: border-color 0.2s;
    }

    .form-control:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
    }

    .form-control.is-invalid {
      border-color: #dc3545;
    }

    .invalid-feedback {
      color: #dc3545;
      font-size: 12px;
      margin-top: 5px;
    }

    .credentials-section {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 4px;
      border: 1px solid #e9ecef;
    }

    .credentials-section h4 {
      margin: 0 0 15px 0;
      color: #495057;
      font-size: 16px;
    }

    .credentials-section .password-field {
      margin-top: 15px;
    }

    .validation-section {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 4px;
      border: 1px solid #e9ecef;
    }

    .validation-actions {
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-info {
      background-color: #17a2b8;
      color: white;
    }

    .btn:hover:not(:disabled) {
      opacity: 0.9;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .alert {
      padding: 12px;
      border-radius: 4px;
      margin: 0;
    }

    .alert-success {
      background-color: #d4edda;
      border: 1px solid #c3e6cb;
      color: #155724;
    }

    .alert-danger {
      background-color: #f8d7da;
      border: 1px solid #f5c6cb;
      color: #721c24;
    }

    .detected-folders h5 {
      margin: 15px 0 10px 0;
      color: #495057;
    }

    .folder-list {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .folder-item {
      padding: 10px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .folder-item:hover {
      background-color: #e9ecef;
    }

    .folder-item.selected {
      background-color: #007bff;
      color: white;
      border-color: #007bff;
    }

    .form-actions {
      display: flex;
      justify-content: space-between;
      margin-top: 20px;
    }
  `]
})
export class RepoConfigComponent implements OnInit {
  configForm: FormGroup;
  isTestingConnection = false;
  isDetectingFolders = false;
  isConnectionValid = false;
  validationMessage = '';
  detectedFolders: string[] = [];
  selectedFolder = '';

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private repoConfigService: RepoConfigService,
    private router: Router
  ) {
    this.configForm = this.fb.group({
      repoUrl: ['https://github.com/Sai-Kushal-Nerella-WL/drools-rules-lite', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
      branch: ['main', Validators.required],
      username: [''],
      password: ['']
    });
  }

  ngOnInit() {
    const existingConfig = this.repoConfigService.getRepoConfig();
    if (existingConfig) {
      this.configForm.patchValue(existingConfig);
      this.selectedFolder = existingConfig.rulesFolder || '';
    }
  }

  testConnection() {
    if (!this.configForm.get('repoUrl')?.value) return;

    this.isTestingConnection = true;
    this.isConnectionValid = false;
    this.validationMessage = '';

    const request: RepoValidationRequest = {
      repoUrl: this.configForm.get('repoUrl')?.value,
      branch: this.configForm.get('branch')?.value || 'main',
      username: this.configForm.get('username')?.value || undefined,
      password: this.configForm.get('password')?.value || undefined
    };

    this.apiService.testConnection(request).subscribe({
      next: (result: ConnectionResult) => {
        this.isTestingConnection = false;
        this.isConnectionValid = result.isConnected;
        this.validationMessage = result.message;
        
        if (result.isConnected) {
          this.repoConfigService.setValidationStatus(true);
        }
      },
      error: (error) => {
        this.isTestingConnection = false;
        this.isConnectionValid = false;
        this.validationMessage = 'Connection test failed. Please check your repository URL and credentials.';
        console.error('Connection test error:', error);
      }
    });
  }

  detectFolders() {
    if (!this.isConnectionValid) return;

    this.isDetectingFolders = true;
    this.detectedFolders = [];

    const request: RepoValidationRequest = {
      repoUrl: this.configForm.get('repoUrl')?.value,
      branch: this.configForm.get('branch')?.value || 'main',
      username: this.configForm.get('username')?.value || undefined,
      password: this.configForm.get('password')?.value || undefined
    };

    this.apiService.detectFolders(request).subscribe({
      next: (result: FolderDetectionResult) => {
        this.isDetectingFolders = false;
        this.detectedFolders = result.folders;
        
        if (this.detectedFolders.length > 0 && !this.selectedFolder) {
          this.selectedFolder = this.detectedFolders[0];
        }
      },
      error: (error) => {
        this.isDetectingFolders = false;
        console.error('Folder detection error:', error);
      }
    });
  }

  selectFolder(folder: string) {
    this.selectedFolder = folder;
  }

  onSubmit() {
    if (this.configForm.valid && this.isConnectionValid) {
      const config: RepoConfig = {
        repoUrl: this.configForm.get('repoUrl')?.value,
        branch: this.configForm.get('branch')?.value,
        username: this.configForm.get('username')?.value || undefined,
        password: this.configForm.get('password')?.value || undefined,
        rulesFolder: this.selectedFolder || undefined
      };

      this.repoConfigService.setRepoConfig(config);
      this.router.navigate(['/']);
    }
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
