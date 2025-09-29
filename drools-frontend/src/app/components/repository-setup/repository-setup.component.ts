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
              placeholder="https://git-manager.devin.ai/proxy/github.com/username/repo-name"
              [class.error]="repoUrlInput.invalid && repoUrlInput.touched">
            <div *ngIf="repoUrlInput.invalid && repoUrlInput.touched" class="error-message">
              Please enter a valid repository URL
            </div>
          </div>

          <div class="form-group">
            <label for="branch">Branch *</label>
            <div class="branch-selection">
              <div class="custom-dropdown" [class.open]="dropdownOpen">
                <div class="dropdown-trigger" 
                     (click)="toggleDropdown()"
                     [class.error]="!config.branch && branchTouched">
                  <span class="selected-branch" *ngIf="config.branch">
                    {{ config.branch }}
                  </span>
                  <span class="placeholder" *ngIf="!config.branch">Select a branch</span>
                  <svg class="dropdown-arrow" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="dropdown-options" *ngIf="dropdownOpen">
                  <div class="dropdown-option" 
                       *ngFor="let branch of staticBranches" 
                       (click)="selectBranch(branch)"
                       [class.selected]="config.branch === branch.name">
                    <span class="branch-name">{{ branch.name }}</span>
                  </div>
                </div>
              </div>
              <div *ngIf="!config.branch && branchTouched" class="error-message">
                Please select a branch
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
            <li>Repository URL should be the full HTTPS URL to your Git repository</li>
            <li>For GitHub repositories, use the proxy format: <code>https://git-manager.devin.ai/proxy/github.com/username/repo</code></li>
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
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
      padding: 24px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      overflow-x: hidden;
    }

    .setup-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      box-shadow: 0 32px 64px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.05);
      padding: 48px;
      max-width: min(640px, calc(100vw - 48px));
      width: 100%;
      position: relative;
      overflow: hidden;
      box-sizing: border-box;
    }

    .setup-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899);
    }

    .setup-header {
      text-align: center;
      margin-bottom: 40px;
    }

    .setup-header h2 {
      color: #1f2937;
      margin-bottom: 12px;
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.025em;
      background: linear-gradient(135deg, #1f2937, #4b5563);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .setup-header p {
      color: #6b7280;
      font-size: 18px;
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
      color: #374151;
      font-size: 15px;
      letter-spacing: -0.01em;
    }

    .form-control {
      width: 100%;
      padding: 16px 20px;
      border: 2px solid #e5e7eb;
      border-radius: 16px;
      font-size: 16px;
      font-weight: 400;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-sizing: border-box;
      background: #ffffff;
      color: #1f2937;
    }

    .form-control::placeholder {
      color: #9ca3af;
      font-weight: 400;
    }

    .form-control:focus {
      outline: none;
      border-color: #6366f1;
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
      transform: translateY(-1px);
    }

    .form-control.error {
      border-color: #ef4444;
      box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
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
      text-align: center;
      margin-top: 40px;
    }

    .btn {
      padding: 16px 32px;
      border: none;
      border-radius: 16px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      min-width: 200px;
      position: relative;
      overflow: hidden;
    }

    .btn-primary {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3);
    }

    .btn-primary::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      transition: left 0.5s;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 12px 32px rgba(99, 102, 241, 0.4);
    }

    .btn-primary:hover:not(:disabled)::before {
      left: 100%;
    }

    .btn-primary:active:not(:disabled) {
      transform: translateY(0);
    }

    .btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
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
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 28px;
      position: relative;
    }

    .setup-help::before {
      content: '💡';
      position: absolute;
      top: 20px;
      right: 24px;
      font-size: 20px;
    }

    .setup-help h4 {
      color: #1e293b;
      margin-bottom: 20px;
      font-size: 18px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .setup-help h4::before {
      content: '📋';
      font-size: 16px;
    }

    .setup-help ul {
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .setup-help li {
      margin-bottom: 12px;
      color: #475569;
      line-height: 1.6;
      padding-left: 24px;
      position: relative;
      font-weight: 400;
    }

    .setup-help li::before {
      content: '→';
      position: absolute;
      left: 0;
      color: #6366f1;
      font-weight: 600;
    }

    .setup-help code {
      background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
      padding: 4px 8px;
      border-radius: 8px;
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
      font-size: 13px;
      font-weight: 500;
      color: #1e293b;
      border: 1px solid #cbd5e1;
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
      border-radius: 16px;
      font-size: 16px;
      font-weight: 400;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-sizing: border-box;
      background: #ffffff;
      color: #1f2937;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 56px;
    }

    .dropdown-trigger:hover {
      border-color: #d1d5db;
    }

    .dropdown-trigger:focus,
    .custom-dropdown.open .dropdown-trigger {
      outline: none;
      border-color: #6366f1;
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
      transform: translateY(-1px);
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
      border: 2px solid #e5e7eb;
      border-top: none;
      border-radius: 0 0 16px 16px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
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
        padding: 12px;
      }
      
      .setup-card {
        padding: 24px 16px;
        border-radius: 16px;
        max-width: calc(100vw - 24px);
      }
      
      .setup-header h2 {
        font-size: 24px;
      }
      
      .form-control {
        padding: 12px 14px;
        font-size: 16px;
      }
      
      .btn {
        padding: 12px 20px;
        min-width: 140px;
      }
    }

    @media (max-width: 768px) {
      .setup-container {
        padding: 16px;
      }
      
      .setup-card {
        padding: 32px 24px;
        border-radius: 20px;
        max-width: calc(100vw - 32px);
      }
      
      .setup-header h2 {
        font-size: 28px;
      }
      
      .form-control {
        padding: 14px 16px;
        font-size: 16px;
      }
      
      .btn {
        padding: 14px 24px;
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
    isConfigured: false
  };

  isSubmitting = false;
  staticBranches = [{ name: 'main' }, { name: 'master' }];
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

  onRepoUrlChange() {
    const repoUrl = this.config.repoUrl;
    console.log('onRepoUrlChange called with:', repoUrl);
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
    return this.staticBranches.find(b => b.name === this.config.branch);
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
