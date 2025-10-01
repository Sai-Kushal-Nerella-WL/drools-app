import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RepositoryConfigService } from '../../services/repository-config.service';
import { ApiService } from '../../services/api.service';
import { RepositoryConfig } from '../../models/repository-config.model';

@Component({
  selector: 'app-repository-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="setup-container">
      <div class="setup-card">
        <div class="setup-header">
          <h2>Repository Configuration</h2>
          <p>Configure your Git repository to get started with Drools Rules Manager</p>
        </div>
        
        <form (ngSubmit)="onSubmit()" #setupForm="ngForm" class="setup-form">
          <div class="form-group">
            <label for="repoUrl">Repository URL *</label>
            <input 
              type="url" 
              id="repoUrl"
              name="repoUrl"
              [(ngModel)]="config.repoUrl"
              #repoUrlInput="ngModel"
              (blur)="onRepoUrlChange()"
              required
              class="form-control"
              placeholder="https://github.com/username/repo-name"
              [class.error]="repoUrlInput.invalid && repoUrlInput.touched">
            <div *ngIf="repoUrlInput.invalid && repoUrlInput.touched" class="error-message">
              Please enter a valid repository URL
            </div>
          </div>

          <div class="form-group">
            <label for="branch">Branch *</label>
            <select 
              id="branch"
              name="branch"
              [(ngModel)]="config.branch"
              #branchSelect="ngModel"
              required
              class="form-control"
              [class.error]="branchSelect.invalid && branchSelect.touched">
              <option value="main">main</option>
              <option value="master">master</option>
            </select>
            <div *ngIf="branchSelect.invalid && branchSelect.touched" class="error-message">
              Please select a branch
            </div>
          </div>

          <div class="form-group">
            <label for="folderPath">Folder Path *</label>
            <div style="display: flex; gap: 10px; align-items: flex-start;">
              <select 
                id="folderPath"
                name="folderPath"
                [(ngModel)]="config.folderPath"
                required
                class="form-control"
                style="flex: 1;"
                [disabled]="availableFolders.length === 0">
                <option *ngFor="let folder of availableFolders" [value]="folder">{{ folder }}</option>
              </select>
              <button 
                type="button"
                class="btn btn-secondary"
                (click)="fetchFolders()"
                [disabled]="!config.repoUrl || !config.branch || isFetchingFolders"
                style="white-space: nowrap;">
                {{ isFetchingFolders ? 'Fetching...' : 'Fetch Folders' }}
              </button>
            </div>
            <div class="help-text" *ngIf="availableFolders.length === 0 && !isFetchingFolders" style="margin-top: 8px;">Click "Fetch Folders" to load available folders from the repository</div>
            <div class="help-text" *ngIf="isFetchingFolders" style="margin-top: 8px;">Loading folders from repository...</div>
            <div class="help-text" *ngIf="availableFolders.length > 0" style="margin-top: 8px;">Select the folder containing your Excel decision tables</div>
          </div>

          <div class="form-group">
            <label for="displayName">Display Name (Optional)</label>
            <input 
              type="text" 
              id="displayName"
              name="displayName"
              [(ngModel)]="config.displayName"
              class="form-control"
              placeholder="My Drools Repository">
          </div>

          <div class="form-actions">
            <button 
              type="button"
              class="btn btn-secondary"
              (click)="clearForm()"
              [disabled]="isSubmitting || isValidating">
              Clear
            </button>
            <button 
              type="submit" 
              class="btn btn-primary"
              [disabled]="!setupForm.form.valid || isSubmitting || isValidating">
              <span *ngIf="isValidating" class="spinner"></span>
              {{ isValidating ? 'Validating...' : isSubmitting ? 'Configuring...' : 'Configure Repository' }}
            </button>
          </div>
          
          <div *ngIf="validationError" class="validation-error">
            <span class="error-icon">⚠️</span>
            {{ validationError }}
          </div>
        </form>

        <div class="setup-help">
          <h4>Need Help?</h4>
          <ul>
            <li>Repository URL should be the full HTTPS URL to your Git repository</li>
            <li>For GitHub repositories, use the format: <code>https://github.com/username/repo</code></li>
            <li>Branch should be the main branch containing your Excel decision tables</li>
            <li>Display name is optional and used for identification purposes</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .setup-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f3c623;
      padding: 24px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      overflow-x: hidden;
    }

    .setup-card {
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      border: 1px solid #e6dfcf;
      padding: 48px;
      max-width: min(640px, calc(100vw - 48px));
      width: 100%;
      position: relative;
      box-sizing: border-box;
    }

    .setup-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: #f3c623;
    }

    .setup-header {
      text-align: center;
      margin-bottom: 40px;
    }

    .setup-header h2 {
      color: #2d2d2d;
      margin-bottom: 12px;
      font-size: 28px;
      font-weight: 600;
      letter-spacing: -0.015em;
    }

    .setup-header p {
      color: #5a5a5a;
      font-size: 15px;
      font-weight: 400;
      line-height: 1.6;
    }

    .setup-form {
      margin-bottom: 40px;
    }

    .form-group {
      margin-bottom: 28px;
      position: relative;
    }

    .form-group label {
      display: block;
      margin-bottom: 12px;
      font-weight: 600;
      color: #333333;
      font-size: 15px;
      letter-spacing: -0.01em;
    }

    .form-control {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #c0c0c0;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 400;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      box-sizing: border-box;
      background: #ffffff;
      color: #2d2d2d;
    }

    select.form-control {
      cursor: pointer;
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
      background-position: right 12px center;
      background-repeat: no-repeat;
      background-size: 16px;
      padding-right: 40px;
      appearance: none;
    }

    .form-control::placeholder {
      color: #999999;
      font-weight: 400;
    }

    .form-control:focus {
      outline: none;
      border-color: #f3c623;
      box-shadow: 0 0 0 3px rgba(243, 198, 35, 0.25);
      transform: translateY(-1px);
    }

    .form-control.error {
      border-color: #d9534f;
      box-shadow: 0 0 0 3px rgba(217, 83, 79, 0.15);
    }

    .error-message {
      color: #ef4444;
      font-size: 14px;
      font-weight: 500;
      margin-top: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .error-message::before {
      content: '⚠';
      font-size: 12px;
    }

    .form-actions {
      margin-top: 32px;
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn {
      padding: 12px 32px;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      min-width: 200px;
      position: relative;
      overflow: hidden;
    }

    .btn::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      transform: translate(-50%, -50%);
      transition: width 0.6s, height 0.6s;
    }

    .btn:active::before {
      width: 300px;
      height: 300px;
    }

    .btn-primary {
      background: #f3c623;
      color: #1b1b1b;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
    }

    .btn-primary:hover:not(:disabled) {
      background: #e0b71f;
      box-shadow: 0 4px 12px rgba(224, 183, 31, 0.3);
      transform: translateY(-2px);
    }

    .btn-primary:active:not(:disabled) {
      background: #cda419;
      transform: translateY(0);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      background: #e9d27a;
    }

    .btn-secondary {
      background: #f5f5f5;
      color: #4a4a4a;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
      border: 1px solid #c0c0c0;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #e8e8e8;
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
      border-color: #a0a0a0;
    }

    .btn-secondary:active:not(:disabled) {
      background: #d8d8d8;
      transform: translateY(0);
    }

    .validation-error {
      margin-top: 20px;
      padding: 16px 20px;
      background: linear-gradient(135deg, #fff5f5 0%, #fee2e2 100%);
      border: 2px solid #f87171;
      border-radius: 10px;
      color: #991b1b;
      font-size: 14px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      line-height: 1.6;
      box-shadow: 0 2px 8px rgba(248, 113, 113, 0.15);
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .error-icon {
      font-size: 20px;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .spinner {
      display: inline-block;
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: #ffffff;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .setup-help {
      background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
      border: 1px solid #d0d0d0;
      border-radius: 10px;
      padding: 24px;
      position: relative;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .setup-help::before {
      content: '💡';
      position: absolute;
      top: 20px;
      right: 24px;
      font-size: 18px;
    }

    .setup-help h4 {
      color: #2d2d2d;
      margin-bottom: 16px;
      font-size: 16px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .setup-help h4::before {
      content: '📋';
      font-size: 14px;
    }

    .setup-help ul {
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .setup-help li {
      margin-bottom: 10px;
      color: #4a4a4a;
      line-height: 1.6;
      padding-left: 20px;
      position: relative;
      font-weight: 400;
    }

    .setup-help li::before {
      content: '•';
      position: absolute;
      left: 0;
      color: #f3c623;
      font-weight: 600;
      font-size: 16px;
    }

    .setup-help code {
      background: #e0e0e0;
      padding: 3px 7px;
      border-radius: 4px;
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
      font-size: 13px;
      font-weight: 500;
      color: #2d2d2d;
    }

    .branch-selection {
      position: relative;
    }

    .custom-dropdown {
      position: relative;
      width: 100%;
    }

    .dropdown-trigger {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #c0c0c0;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 400;
      transition: all 0.2s ease;
      box-sizing: border-box;
      background: #ffffff;
      color: #2d2d2d;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 48px;
    }

    .dropdown-trigger:hover {
      border-color: #a0a0a0;
    }

    .dropdown-trigger:focus,
    .custom-dropdown.open .dropdown-trigger {
      outline: none;
      border-color: #f3c623;
      box-shadow: 0 0 0 3px rgba(243, 198, 35, 0.25);
    }

    .dropdown-trigger.error {
      border-color: #ef4444;
    }

    .selected-branch {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
    }

    .placeholder {
      color: #9ca3af;
    }

    .dropdown-arrow {
      width: 20px;
      height: 20px;
      color: #6b7280;
      transition: transform 0.2s ease;
      flex-shrink: 0;
    }

    .custom-dropdown.open .dropdown-arrow {
      transform: rotate(180deg);
    }

    .dropdown-options {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: #ffffff;
      border: 1px solid #c0c0c0;
      border-top: none;
      border-radius: 0 0 8px 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      z-index: 1000;
      max-height: 300px;
      overflow-y: hidden;
      overflow-x: hidden;
    }

    .dropdown-options:hover {
      overflow-y: auto;
    }

    .dropdown-option {
      padding: 12px 20px;
      cursor: pointer;
      transition: background-color 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #f3f4f6;
    }

    .dropdown-option:last-child {
      border-bottom: none;
    }

    .dropdown-option:hover {
      background: #f8fafc;
    }

    .dropdown-option.selected {
      background: #fff4cc;
      color: #6b5a00;
      font-weight: 500;
    }

    .branch-name {
      font-size: 15px;
      line-height: 1.5;
    }

    .branch-tags {
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .branch-tag {
      display: inline-block;
      font-size: 10px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 8px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      white-space: nowrap;
    }

    .main-tag {
      background: #5cb85c;
      color: white;
    }

    .latest-tag {
      background: #f0ad4e;
      color: white;
    }

    .loading-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #6b7280;
      font-size: 14px;
      margin-top: 8px;
    }

    .loading-indicator .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid #e0e0e0;
      border-top: 2px solid #f3c623;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @media (max-width: 480px) {
      .setup-container {
        padding: 12px;
      }
      
      .setup-card {
        padding: 24px 16px;
        border-radius: 12px;
        max-width: calc(100vw - 24px);
      }
      
      .setup-header h2 {
        font-size: 22px;
      }
      
      .form-control {
        padding: 10px 12px;
        font-size: 15px;
      }
      
      .btn {
        padding: 10px 20px;
        min-width: 140px;
      }
    }

    @media (max-width: 768px) {
      .setup-container {
        padding: 16px;
      }
      
      .setup-card {
        padding: 32px 24px;
        border-radius: 12px;
        max-width: calc(100vw - 32px);
      }
      
      .setup-header h2 {
        font-size: 24px;
      }
      
      .form-control {
        padding: 11px 14px;
        font-size: 15px;
      }
      
      .btn {
        padding: 11px 24px;
        min-width: 160px;
      }
    }
  `]
})
export class RepositorySetupComponent implements OnInit, OnDestroy {
  @Output() configurationComplete = new EventEmitter<RepositoryConfig>();

  config: RepositoryConfig = {
    repoUrl: '',
    branch: 'main',
    displayName: '',
    folderPath: '/',
    isConfigured: false
  };

  isSubmitting = false;
  validationError = '';
  isValidating = false;
  isFetchingFolders = false;
  availableFolders: string[] = [];

  constructor(
    private repositoryConfigService: RepositoryConfigService,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    setTimeout(() => {
      if (!this.config.branch) {
        this.config.branch = 'main';
      }
      if (!this.config.folderPath) {
        this.config.folderPath = '/';
      }
    }, 0);
  }

  ngOnDestroy() {
  }


  onRepoUrlChange() {
    const repoUrl = this.config.repoUrl;
    console.log('onRepoUrlChange called with:', repoUrl);
    
    if (repoUrl && repoUrl.trim()) {
      const githubPattern = /^https:\/\/github\.com\/[\w-]+\/[\w-]+$/;
      const gitlabPattern = /^https:\/\/gitlab\.com\/[\w-]+\/[\w-]+$/;
      
      if (!githubPattern.test(repoUrl) && !gitlabPattern.test(repoUrl)) {
        this.validationError = 'Please enter a valid GitHub or GitLab repository URL (e.g., https://github.com/username/repo)';
      } else {
        this.validationError = '';
      }
    }
    
    this.availableFolders = [];
    this.config.folderPath = '/';
  }

  clearForm() {
    this.config = {
      repoUrl: '',
      branch: 'main',
      displayName: '',
      folderPath: '/',
      isConfigured: false
    };
    this.validationError = '';
    this.availableFolders = [];
  }

  fetchFolders() {
    if (this.isFetchingFolders) return;
    
    this.isFetchingFolders = true;
    this.validationError = '';
    
    this.apiService.listRemoteBranches(this.config.repoUrl).subscribe({
      next: (branches) => {
        const branchExists = branches.some((b: any) => b.name === this.config.branch);
        
        if (!branchExists) {
          this.validationError = `Branch "${this.config.branch}" not found in repository. Please select a valid branch.`;
          this.isFetchingFolders = false;
          return;
        }
        
        this.fetchAvailableFolders();
      },
      error: (error) => {
        this.validationError = `Unable to access repository: ${error.error?.error || error.message || 'Please check the URL and try again'}`;
        this.isFetchingFolders = false;
      }
    });
  }

  onSubmit() {
    if (this.isSubmitting || this.isValidating) return;
    
    if (this.availableFolders.length === 0) {
      this.validationError = 'Please fetch folders first by clicking the "Fetch Folders" button';
      return;
    }
    
    if (!this.config.folderPath) {
      this.validationError = 'Please select a folder';
      return;
    }
    
    this.completeConfiguration();
  }
  
  private fetchAndCloneRepository() {
    this.apiService.pullFromRepo({
      repoUrl: this.config.repoUrl,
      branch: this.config.branch
    }).subscribe({
      next: () => {
        this.fetchAvailableFolders();
      },
      error: (error) => {
        this.validationError = `Failed to clone repository: ${error.error?.error || error.message}`;
        this.isFetchingFolders = false;
      }
    });
  }
  
  private fetchAvailableFolders() {
    this.apiService.listRepositoryFolders(this.config.repoUrl).subscribe({
      next: (response) => {
        this.availableFolders = response.folders || ['/'];
        
        if (this.availableFolders.includes('/rules')) {
          this.config.folderPath = '/rules';
        } else if (this.availableFolders.length > 0) {
          this.config.folderPath = this.availableFolders[0];
        }
        
        this.isFetchingFolders = false;
      },
      error: (error) => {
        console.error('Failed to fetch folders:', error);
        
        if (error.error?.error?.includes('Repository not cloned yet')) {
          this.fetchAndCloneRepository();
        } else {
          this.availableFolders = ['/'];
          this.config.folderPath = '/';
          this.validationError = `Failed to fetch folders: ${error.error?.error || error.message}`;
          this.isFetchingFolders = false;
        }
      }
    });
  }
  
  private completeConfiguration() {
    this.isValidating = true;
    const configToSave: RepositoryConfig = {
      ...this.config,
      isConfigured: true
    };
    
    this.repositoryConfigService.saveConfig(configToSave);
    this.configurationComplete.emit(configToSave);
    this.isValidating = false;
  }
}
