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
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      padding: 24px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      overflow-x: hidden;
      transition: all 0.3s ease;
    }

    .setup-card {
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 
        0 20px 40px rgba(0, 0, 0, 0.15),
        0 10px 20px rgba(0, 0, 0, 0.1),
        0 0 0 1px rgba(255, 255, 255, 0.05);
      padding: 48px;
      max-width: min(600px, calc(100vw - 48px));
      width: 100%;
      position: relative;
      box-sizing: border-box;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      transform: translateY(0);
    }

    .setup-card:hover {
      transform: translateY(-4px);
      box-shadow: 
        0 32px 64px rgba(0, 0, 0, 0.2),
        0 16px 32px rgba(0, 0, 0, 0.15),
        0 0 0 1px rgba(255, 255, 255, 0.1);
    }

    .setup-header {
      text-align: center;
      margin-bottom: 40px;
      position: relative;
    }

    .setup-header::before {
      content: '';
      position: absolute;
      top: -20px;
      left: 50%;
      transform: translateX(-50%);
      width: 60px;
      height: 4px;
      background: linear-gradient(90deg, #1a1a1a, #4a4a4a);
      border-radius: 2px;
      opacity: 0.8;
    }

    .setup-header h2 {
      color: #1a1a1a;
      margin-bottom: 12px;
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.03em;
      line-height: 1.2;
      transition: color 0.3s ease;
    }

    .setup-header p {
      color: #6b7280;
      font-size: 16px;
      font-weight: 400;
      line-height: 1.6;
      margin: 0;
      transition: color 0.3s ease;
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
      margin-bottom: 10px;
      font-weight: 600;
      color: #1a1a1a;
      font-size: 14px;
      letter-spacing: -0.01em;
      transition: color 0.3s ease;
      position: relative;
      padding-left: 16px;
    }

    .form-group label::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 14px;
      background: linear-gradient(135deg, #1a1a1a, #4a4a4a);
      border-radius: 2px;
      transition: all 0.3s ease;
    }

    .form-control {
      width: 100%;
      padding: 16px 20px;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 400;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-sizing: border-box;
      background: #ffffff;
      color: #1a1a1a;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
    }

    .form-control::placeholder {
      color: #9ca3af;
      font-weight: 400;
      transition: color 0.3s ease;
    }

    .form-control:hover {
      border-color: #4a4a4a;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.06);
      transform: translateY(-1px);
    }

    .form-control:focus {
      outline: none;
      border-color: #1a1a1a;
      box-shadow: 
        0 0 0 4px rgba(26, 26, 26, 0.1),
        0 8px 16px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .form-control:focus::placeholder {
      color: #d1d5db;
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
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      color: white;
      box-shadow: 
        0 4px 12px rgba(26, 26, 26, 0.3),
        0 2px 4px rgba(0, 0, 0, 0.1);
      position: relative;
      overflow: hidden;
    }

    .btn-primary::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      transition: left 0.6s ease;
    }

    .btn-primary:hover:not(:disabled) {
      background: linear-gradient(135deg, #2d2d2d 0%, #4a4a4a 100%);
      box-shadow: 
        0 8px 20px rgba(26, 26, 26, 0.4),
        0 4px 8px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }

    .btn-primary:hover:not(:disabled)::before {
      left: 100%;
    }

    .btn-primary:active:not(:disabled) {
      background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
      transform: translateY(0);
      box-shadow: 
        0 2px 8px rgba(26, 26, 26, 0.3),
        0 1px 2px rgba(0, 0, 0, 0.1);
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
      background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 28px;
      position: relative;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      transition: all 0.3s ease;
    }

    .setup-help:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      transform: translateY(-1px);
    }

    .setup-help h4 {
      color: #1a1a1a;
      margin-bottom: 20px;
      font-size: 18px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 10px;
      transition: color 0.3s ease;
    }

    .setup-help h4::before {
      content: '💡';
      font-size: 18px;
      padding: 8px;
      background: linear-gradient(135deg, #1a1a1a, #2d2d2d);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(26, 26, 26, 0.2);
    }

    .setup-help ul {
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .setup-help li {
      color: #4a5568;
      line-height: 1.6;
      padding: 12px 0 12px 28px;
      position: relative;
      font-weight: 400;
      margin-bottom: 4px;
      font-size: 14px;
      transition: all 0.3s ease;
      border-radius: 8px;
    }

    .setup-help li:hover {
      background: rgba(26, 26, 26, 0.02);
      color: #2d3748;
      padding-left: 32px;
    }

    .setup-help li::before {
      content: '';
      position: absolute;
      left: 8px;
      top: 50%;
      transform: translateY(-50%);
      width: 6px;
      height: 6px;
      background: linear-gradient(135deg, #1a1a1a, #4a4a4a);
      border-radius: 50%;
      transition: all 0.3s ease;
    }

    .setup-help li:hover::before {
      transform: translateY(-50%) scale(1.2);
      box-shadow: 0 0 8px rgba(26, 26, 26, 0.3);
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
      padding: 16px 20px;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 400;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-sizing: border-box;
      background: #ffffff;
      color: #1a1a1a;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 56px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
    }

    .dropdown-trigger:hover {
      border-color: #4a4a4a;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.06);
      transform: translateY(-1px);
    }

    .dropdown-trigger:focus,
    .custom-dropdown.open .dropdown-trigger {
      outline: none;
      border-color: #1a1a1a;
      box-shadow: 
        0 0 0 4px rgba(26, 26, 26, 0.1),
        0 8px 16px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
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
      width: 24px;
      height: 24px;
      color: #4a4a4a;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      flex-shrink: 0;
    }

    .custom-dropdown.open .dropdown-arrow {
      transform: rotate(180deg);
      color: #1a1a1a;
    }

    .dropdown-options {
      position: absolute;
      top: calc(100% - 2px);
      left: 0;
      right: 0;
      background: #ffffff;
      border: 2px solid #e5e7eb;
      border-top: none;
      border-radius: 0 0 12px 12px;
      box-shadow: 
        0 8px 24px rgba(0, 0, 0, 0.12),
        0 4px 8px rgba(0, 0, 0, 0.08);
      z-index: 1000;
      max-height: 240px;
      overflow-y: auto;
      animation: dropdownSlide 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @keyframes dropdownSlide {
      from { 
        opacity: 0; 
        transform: translateY(-8px) scale(0.98); 
      }
      to { 
        opacity: 1; 
        transform: translateY(0) scale(1); 
      }
    }

    .dropdown-option {
      padding: 16px 20px;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #f3f4f6;
      position: relative;
    }

    .dropdown-option::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 0;
      background: linear-gradient(135deg, #1a1a1a, #2d2d2d);
      transition: width 0.3s ease;
    }

    .dropdown-option:last-child {
      border-bottom: none;
    }

    .dropdown-option:hover {
      background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
      color: #1a1a1a;
      transform: translateX(4px);
    }

    .dropdown-option:hover::before {
      width: 4px;
    }

    .dropdown-option.selected {
      background: linear-gradient(135deg, #f0f0f0 0%, #ffffff 100%);
      color: #1a1a1a;
      font-weight: 600;
    }

    .dropdown-option.selected::before {
      width: 4px;
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
