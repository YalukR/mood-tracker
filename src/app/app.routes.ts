import { Routes } from '@angular/router';
import { setupCompletedGuard, setupNotCompletedGuard } from './core/guards/setup.guard';
import { lockGuard } from './core/guards/lock.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },

    {
        path: 'setup',
        loadComponent: () => import('./layout/setup/setup').then(m => m.Setup),
        canActivate: [setupNotCompletedGuard],
    },
    {
        path: 'lock',
        loadComponent: () => import('./layout/lock/lock').then(m => m.Lock),
        canActivate: [setupCompletedGuard],
    },

    {
        path: 'documentation',
        loadComponent: () => import('./pages/documentation/documentation').then(m => m.Documentation),
        canActivate: [setupCompletedGuard, lockGuard],
        data: { headerIcon: 'pi-book', title: 'Documentación' },
    }, {
        path: 'stats',
        loadComponent: () => import('./pages/stats/stats').then(m => m.Stats),
        canActivate: [setupCompletedGuard, lockGuard],
        data: { icon: 'pi-chart-bar', label: 'Stats', title: 'Estadísticas' },
    },
    {
        path: 'home',
        loadComponent: () => import('./pages/home/home').then(m => m.Home),
        canActivate: [setupCompletedGuard, lockGuard],
        data: { icon: 'pi-home', label: 'Home', title: 'Inicio' },
    },
    {
        path: 'calendar',
        loadComponent: () => import('./pages/calendar/calendar').then(m => m.Calendar),
        canActivate: [setupCompletedGuard, lockGuard],
        data: { icon: 'pi-calendar', label: 'Calendario', title: 'Calendario' },
    },
    {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings').then(m => m.Settings),
        canActivate: [setupCompletedGuard, lockGuard],
        data: { headerIcon: 'pi-cog', title: 'Configuración' },
    },
    {
        path: 'register',
        loadComponent: () => import('./pages/mood-form/mood-form').then(m => m.MoodForm),
        canActivate: [setupCompletedGuard, lockGuard],
        data: { title: 'Nuevo registro' },
    },
];