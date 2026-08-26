import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService, ThemeOption } from '../../../core/services/theme.service';
import { SlidingIndicator } from '../../../shared/sliding-indicator';

@Component({
  selector: 'app-theme',
  standalone: true,
  imports: [CommonModule, SlidingIndicator],
  templateUrl: './theme.html',
})
export class Theme implements OnInit {
  themeOptions: { value: ThemeOption; label: string; icon: string }[] = [
    { value: 'light', label: 'Claro', icon: 'pi-sun' },
    { value: 'dark', label: 'Oscuro', icon: 'pi-moon' },
    { value: 'system', label: 'Sistema', icon: 'pi-desktop' },
  ];

  currentTheme = signal<ThemeOption>('system');

  constructor(private themeService: ThemeService) { }

  ngOnInit(): void {
    this.currentTheme.set(this.themeService.getTheme());
  }

  activeThemeIndex = computed(() =>
    Math.max(0, this.themeOptions.findIndex(o => o.value === this.currentTheme()))
  );

  setTheme(theme: ThemeOption): void {
    this.currentTheme.set(theme);
    this.themeService.setTheme(theme);
  }
}