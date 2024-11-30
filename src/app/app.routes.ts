import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { DiagnosticsComponent } from './pages/diagnostics/diagnostics.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadChildren: () => import('./pages/home/home.module').then(m => m.HomeModule),
  },
  {
    path: 'play',
    loadChildren: () => import('./pages/players/player.module').then(m => m.PlayerModule),
  },
  {
    path: 'dig',
    component: DiagnosticsComponent,
  },
  {
    path: '404',
    loadChildren: () => import('./pages/not-found/not-found.module').then(m => m.NotFoundModule),
  },
  {
    path: '**',
    redirectTo: '/404',
  },
];
