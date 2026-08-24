import { Routes } from '@angular/router';
import { setupCompletedGuard, setupNotCompletedGuard } from './core/guards/setup.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },

    {
        path: 'setup',
        loadComponent: () => import('./layout/setup/setup').then(m => m.Setup),
        canActivate: [setupNotCompletedGuard],
    },

    {
        path: 'documentation',
        loadComponent: () => import('./pages/documentation/documentation').then(m => m.Documentation),
        canActivate: [setupCompletedGuard],
        data: { headerIcon: 'pi-book', title: 'Documentación' },
    }, {
        path: 'stats',
        loadComponent: () => import('./pages/stats/stats').then(m => m.Stats),
        canActivate: [setupCompletedGuard],
        data: { icon: 'pi-chart-bar', label: 'Stats', title: 'Estadísticas' },
    },
    {
        path: 'home',
        loadComponent: () => import('./pages/home/home').then(m => m.Home),
        canActivate: [setupCompletedGuard],
        data: { icon: 'pi-home', label: 'Home', title: 'Inicio' },
    },
    {
        path: 'calendar',
        loadComponent: () => import('./pages/calendar/calendar').then(m => m.Calendar),
        canActivate: [setupCompletedGuard],
        data: { icon: 'pi-calendar', label: 'Calendario', title: 'Calendario' },
    },
    {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings').then(m => m.Settings),
        canActivate: [setupCompletedGuard],
        data: { headerIcon: 'pi-cog', title: 'Configuración' },
    },
    {
        path: 'register',
        loadComponent: () => import('./pages/mood-form/mood-form').then(m => m.MoodForm),
        canActivate: [setupCompletedGuard],
        data: { title: 'Nuevo registro' },
    },
];