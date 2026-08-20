import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    {
        path: 'stats',
        loadComponent: () => import('./pages/stats/stats').then(m => m.Stats),
        data: { icon: 'pi-chart-bar', label: 'Stats' },
    },
    {
        path: 'home',
        loadComponent: () => import('./pages/home/home').then(m => m.Home),
        data: { icon: 'pi-home', label: 'Home' },
    },
    {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings').then(m => m.Settings),
        data: { icon: 'pi-cog', label: 'Configuraciones' },
    },
];
