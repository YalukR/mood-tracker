import { Injectable } from '@angular/core';

export type ThemeOption = 'light' | 'dark' | 'system';
const STORAGE_KEY = 'app-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  getTheme(): ThemeOption {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeOption | null;
    const theme = saved ?? 'light'; // default: claro si el usuario nunca ha elegido
    this.applyTheme(theme);
    return theme;
  }

  setTheme(theme: ThemeOption): void {
    localStorage.setItem(STORAGE_KEY, theme);
    this.applyTheme(theme);
  }

  private applyTheme(theme: ThemeOption): void {
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
  }
}