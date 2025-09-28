import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RepositoryConfigService } from '../../services/repository-config.service';
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
            <input 
              type="text" 
              id="branch"
              name="branch"
              [(ngModel)]="config.branch"
              #branchInput="ngModel"
              required
              class="form-control"
              placeholder="main"
              [class.error]="branchInput.invalid && branchInput.touched">
            <div *ngIf="branchInput.invalid && branchInput.touched" class="error-message">
              Please enter a branch name
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .setup-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
      padding: 40px;
      max-width: 600px;
      width: 100%;
    }

    .setup-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .setup-header h2 {
      color: #333;
      margin-bottom: 10px;
      font-size: 28px;
    }

    .setup-header p {
      color: #666;
      font-size: 16px;
    }

    .setup-form {
      margin-bottom: 30px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: #333;
    }

    .form-control {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e1e5e9;
      border-radius: 8px;
      font-size: 16px;
      transition: border-color 0.3s ease;
      box-sizing: border-box;
    }

    .form-control:focus {
      outline: none;
      border-color: #007bff;
    }

    .form-control.error {
      border-color: #dc3545;
    }

    .error-message {
      color: #dc3545;
      font-size: 14px;
      margin-top: 5px;
    }

    .form-actions {
      text-align: center;
      margin-top: 30px;
    }

    .btn {
      padding: 12px 30px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .btn-primary {
      background: linear-gradient(135deg, #007bff, #0056b3);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0,123,255,0.3);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid #ffffff;
      border-radius: 50%;
      border-top-color: transparent;
      animation: spin 1s ease-in-out infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .setup-help {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
    }

    .setup-help h4 {
      color: #333;
      margin-bottom: 15px;
    }

    .setup-help ul {
      margin: 0;
      padding-left: 20px;
    }

    .setup-help li {
      margin-bottom: 8px;
      color: #666;
      line-height: 1.5;
    }

    .setup-help code {
      background: #e9ecef;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
    }
  `]
})
export class RepositorySetupComponent {
  @Output() configurationComplete = new EventEmitter<RepositoryConfig>();

  config: RepositoryConfig = {
    repoUrl: '',
    branch: 'main',
    displayName: '',
    isConfigured: false
  };

  isSubmitting = false;

  constructor(private repositoryConfigService: RepositoryConfigService) {}

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
