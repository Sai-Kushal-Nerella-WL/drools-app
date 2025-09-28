import { Routes } from '@angular/router';
import { RepoConfigComponent } from './components/repo-config/repo-config.component';

export const routes: Routes = [
  { path: 'repo-config', component: RepoConfigComponent },
  { path: '', redirectTo: '/', pathMatch: 'full' }
];
