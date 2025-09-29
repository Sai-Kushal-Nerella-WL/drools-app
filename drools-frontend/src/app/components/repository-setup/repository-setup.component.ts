import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RepositoryConfigService } from '../../services/repository-config.service';
import { ApiService } from '../../services/api.service';
import { RepositoryConfig, RepositoryType } from '../../models/repository-config.model';

@Component({
  selector: 'app-repository-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="setup-container">
      <div class="setup-card">
        <div class="setup-header">
          <h2>Repository Configuration</h2>
          <p>Configure your repository to get started with Drools Rules Manager</p>
        </div>
        
        <form (ngSubmit)="onSubmit()" #setupForm="ngForm" class="setup-form">
          <div class="form-group">
            <label for="repositoryType">Repository Type *</label>
            <select 
              id="repositoryType"
              name="repositoryType"
              [(ngModel)]="config.repositoryType"
              required
              class="form-control"
              (change)="onRepositoryTypeChange()">
              <option value="GIT">Git Repository</option>
              <option value="LOCAL_FILESYSTEM">Local File System</option>
            </select>
          </div>

          <div class="form-group" *ngIf="config.repositoryType === 'GIT'">
            <label for="repoUrl">Repository URL *</label>
            <input 
              type="url" 
              id="repoUrl"
              name="repoUrl"
              [(ngModel)]="config.repoUrl"
              #repoUrlInput="ngModel"
              (blur)="onRepoUrlChange()"
              [required]="config.repositoryType === 'GIT'"
              class="form-control"
              placeholder="https://git-manager.devin.ai/proxy/github.com/username/repo-name"
              [class.error]="repoUrlInput.invalid && repoUrlInput.touched">
            <div *ngIf="repoUrlInput.invalid && repoUrlInput.touched" class="error-message">
              Please enter a valid repository URL
            </div>
          </div>

          <div class="form-group" *ngIf="config.repositoryType === 'LOCAL_FILESYSTEM'">
            <label for="localPath">Local Directory Path *</label>
            <input 
              type="text" 
              id="localPath"
              name="localPath"
              [(ngModel)]="config.localPath"
              #localPathInput="ngModel"
              [required]="config.repositoryType === 'LOCAL_FILESYSTEM'"
              class="form-control"
              placeholder="/path/to/your/rules/directory"
              [class.error]="localPathInput.invalid && localPathInput.touched">
            <div *ngIf="localPathInput.invalid && localPathInput.touched" class="error-message">
              Please enter a valid local directory path
            </div>
          </div>

          <div class="form-group" *ngIf="config.repositoryType === 'GIT'">
            <label for="branch">Branch *</label>
            <div class="branch-selection">
              <div *ngIf="availableBranches.length > 0 && !branchFetchError">
                <div class="custom-dropdown" [class.open]="dropdownOpen">
                  <div class="dropdown-trigger" 
                       (click)="toggleDropdown()"
                       [class.error]="!config.branch && branchTouched">
                    <span class="selected-branch" *ngIf="config.branch">
                      {{ config.branch }}
                      <span *ngIf="getSelectedBranch()?.isMain" class="branch-tag main-tag">main</span>
                      <span *ngIf="getSelectedBranch()?.isLatest" class="branch-tag latest-tag">latest</span>
                    </span>
                    <span class="placeholder" *ngIf="!config.branch">Select a branch</span>
                    <svg class="dropdown-arrow" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div class="dropdown-options" *ngIf="dropdownOpen">
                    <div class="dropdown-option" 
                         *ngFor="let branch of availableBranches" 
                         (click)="selectBranch(branch)"
                         [class.selected]="config.branch === branch.name">
                      <span class="branch-name">{{ branch.name }}</span>
                      <div class="branch-tags">
                        <span *ngIf="branch.isMain" class="branch-tag main-tag">main</span>
                        <span *ngIf="branch.isLatest" class="branch-tag latest-tag">latest</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div *ngIf="!config.branch && branchTouched" class="error-message">
                  Please select a branch
                </div>
              </div>
              
              <div *ngIf="availableBranches.length === 0 || branchFetchError">
                <input 
                  type="text" 
                  id="branch-input"
                  name="branch"
                  [(ngModel)]="config.branch"
                  [required]="config.repositoryType === 'GIT'"
                  class="form-control"
                  placeholder="main"
                  [class.error]="!config.branch && branchTouched">
                <div *ngIf="!config.branch && branchTouched" class="error-message">
                  Please enter a branch name
                </div>
              </div>
              
              <div class="loading-indicator" *ngIf="loadingBranches">
                <span class="spinner"></span> Loading branches...
              </div>
              
              <div class="error-message" *ngIf="branchFetchError">
                Could not fetch branches. Please enter manually.
              </div>
            </div>
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
              type="submit" 
              class="btn btn-primary"
              [disabled]="!setupForm.form.valid || isSubmitting">
              <span *ngIf="isSubmitting" class="spinner"></span>
              {{ isSubmitting ? 'Configuring...' : 'Configure Repository' }}
            </button>
          </div>
        </form>

        <div class="setup-help">
          <h4>Need Help?</h4>
          <ul>
            <li *ngIf="config.repositoryType === 'GIT'">Repository URL should be the full HTTPS URL to your Git repository</li>
            <li *ngIf="config.repositoryType === 'GIT'">For GitHub repositories, use the proxy format: <code>https://git-manager.devin.ai/proxy/github.com/username/repo</code></li>
            <li *ngIf="config.repositoryType === 'GIT'">Branch should be the main branch containing your Excel decision tables</li>
            <li *ngIf="config.repositoryType === 'LOCAL_FILESYSTEM'">Local path should point to a directory containing a 'rules' subdirectory with Excel files</li>
            <li *ngIf="config.repositoryType === 'LOCAL_FILESYSTEM'">Make sure the directory exists and is accessible</li>
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
      background: #fafafa;
      padding: 24px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      overflow-x: hidden;
    }

    .setup-card {
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
      padding: 48px;
      max-width: min(600px, calc(100vw - 48px));
      width: 100%;
      position: relative;
      box-sizing: border-box;
      border: 1px solid #e5e7eb;
    }

    .setup-header {
      text-align: center;
      margin-bottom: 40px;
    }

    .setup-header h2 {
      color: #111827;
      margin-bottom: 8px;
      font-size: 28px;
      font-weight: 600;
      letter-spacing: -0.025em;
      line-height: 1.25;
    }

    .setup-header p {
      color: #6b7280;
      font-size: 16px;
      font-weight: 400;
      line-height: 1.5;
      margin: 0;
    }

    .setup-form {
      margin-bottom: 32px;
    }

    .form-group {
      margin-bottom: 24px;
      position: relative;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #374151;
      font-size: 14px;
      letter-spacing: 0;
    }

    .form-control {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 400;
      transition: all 0.2s ease;
      box-sizing: border-box;
      background: #ffffff;
      color: #111827;
    }

    .form-control::placeholder {
      color: #9ca3af;
      font-weight: 400;
    }

    .form-control:hover {
      border-color: #9ca3af;
    }

    .form-control:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-control.error {
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }

    .error-message {
      color: #ef4444;
      font-size: 14px;
      font-weight: 500;
      margin-top: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .error-message::before {
      content: '⚠';
      font-size: 12px;
    }

    .form-actions {
      text-align: center;
      margin-top: 32px;
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-width: 160px;
      position: relative;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .btn-primary:active:not(:disabled) {
      background: #1d4ed8;
      transform: translateY(1px);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: #ffffff;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .setup-help {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 24px;
      position: relative;
    }

    .setup-help h4 {
      color: #111827;
      margin-bottom: 16px;
      font-size: 16px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .setup-help h4::before {
      content: '💡';
      font-size: 16px;
    }

    .setup-help ul {
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .setup-help li {
      color: #6b7280;
      line-height: 1.5;
      padding-left: 20px;
      position: relative;
      font-weight: 400;
      margin-bottom: 8px;
      font-size: 14px;
    }

    .setup-help li::before {
      content: '•';
      position: absolute;
      left: 0;
      color: #3b82f6;
      font-weight: 600;
    }

    .setup-help code {
      background: #f3f4f6;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
      font-size: 13px;
      font-weight: 500;
      color: #374151;
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
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 400;
      transition: all 0.2s ease;
      box-sizing: border-box;
      background: #ffffff;
      color: #111827;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 44px;
    }

    .dropdown-trigger:hover {
      border-color: #9ca3af;
    }

    .dropdown-trigger:focus,
    .custom-dropdown.open .dropdown-trigger {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .dropdown-trigger.error {
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }

    .selected-branch {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      font-weight: 400;
    }

    .placeholder {
      color: #9ca3af;
      font-weight: 400;
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
      border: 1px solid #d1d5db;
      border-top: none;
      border-radius: 0 0 6px 6px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      max-height: 200px;
      overflow-y: auto;
    }

    .dropdown-option {
      padding: 12px 16px;
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
      background: #f9fafb;
    }

    .dropdown-option.selected {
      background: #eff6ff;
      color: #1d4ed8;
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
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
    }

    .latest-tag {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
      box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);
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
      border: 2px solid #e5e7eb;
      border-top: 2px solid #6366f1;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @media (max-width: 480px) {
      .setup-container {
        padding: 16px;
      }
      
      .setup-card {
        padding: 24px;
        max-width: calc(100vw - 32px);
      }
      
      .setup-header h2 {
        font-size: 24px;
      }
      
      .form-control {
        padding: 10px 12px;
        font-size: 16px;
      }
      
      .btn {
        padding: 10px 16px;
        min-width: 120px;
        font-size: 14px;
      }
    }

    @media (max-width: 768px) {
      .setup-container {
        padding: 20px;
      }
      
      .setup-card {
        padding: 32px;
        max-width: calc(100vw - 40px);
      }
      
      .setup-header h2 {
        font-size: 26px;
      }
    }
  `]
})
export class RepositorySetupComponent implements OnInit, OnDestroy {
  @Output() configurationComplete = new EventEmitter<RepositoryConfig>();

  RepositoryType = RepositoryType;
  
  config: RepositoryConfig = {
    repositoryType: RepositoryType.GIT,
    repoUrl: '',
    localPath: '',
    branch: 'main',
    displayName: '',
    isConfigured: false
  };

  isSubmitting = false;
  availableBranches: any[] = [];
  loadingBranches = false;
  branchFetchError = false;
  dropdownOpen = false;
  branchTouched = false;

  constructor(
    private repositoryConfigService: RepositoryConfigService,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    document.addEventListener('click', this.onDocumentClick.bind(this));
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.onDocumentClick.bind(this));
  }

  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const dropdown = target.closest('.custom-dropdown');
    if (!dropdown && this.dropdownOpen) {
      this.dropdownOpen = false;
    }
  }

  onRepositoryTypeChange() {
    this.availableBranches = [];
    this.branchFetchError = false;
    this.dropdownOpen = false;
    this.branchTouched = false;
    
    if (this.config.repositoryType === RepositoryType.LOCAL_FILESYSTEM) {
      this.config.branch = '';
      this.config.repoUrl = '';
    } else {
      this.config.localPath = '';
      this.config.branch = 'main';
    }
  }

  onRepoUrlChange() {
    if (this.config.repositoryType !== RepositoryType.GIT) {
      return;
    }
    
    const repoUrl = this.config.repoUrl;
    console.log('onRepoUrlChange called with:', repoUrl);
    if (repoUrl && repoUrl.trim()) {
      this.fetchBranches(repoUrl.trim());
    } else {
      this.availableBranches = [];
      this.branchFetchError = false;
    }
  }

  fetchBranches(repoUrl: string) {
    if (this.config.repositoryType !== RepositoryType.GIT) {
      return;
    }
    
    console.log('fetchBranches called with:', repoUrl);
    this.loadingBranches = true;
    this.branchFetchError = false;
    this.availableBranches = [];
    
    this.apiService.listRemoteBranches(repoUrl).subscribe({
      next: (branches) => {
        console.log('Branches fetched successfully:', branches);
        this.availableBranches = branches;
        this.loadingBranches = false;
        
        const mainBranch = branches.find(b => b.isMain);
        if (mainBranch) {
          this.config.branch = mainBranch.name;
        } else if (branches.length > 0) {
          this.config.branch = branches[0].name;
        }
      },
      error: (error) => {
        console.error('Failed to fetch branches:', error);
        this.loadingBranches = false;
        this.branchFetchError = true;
        this.availableBranches = [];
        this.config.branch = 'main';
      }
    });
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
    this.branchTouched = true;
  }

  selectBranch(branch: any) {
    this.config.branch = branch.name;
    this.dropdownOpen = false;
    this.branchTouched = true;
  }

  getSelectedBranch() {
    return this.availableBranches.find(b => b.name === this.config.branch);
  }

  onSubmit() {
    if (this.isSubmitting) return;
    
    this.isSubmitting = true;
    
    setTimeout(() => {
      const configToSave: RepositoryConfig = {
        ...this.config,
        isConfigured: true
      };
      
      this.repositoryConfigService.saveConfig(configToSave);
      this.configurationComplete.emit(configToSave);
      this.isSubmitting = false;
    }, 1000);
  }
}
