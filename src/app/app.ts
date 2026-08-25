import { Component, signal, inject, computed, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { ToastModule } from 'primeng/toast';
import { PageFooter } from './layout/page-footer/page-footer';
import { PageHeader } from './layout/page-header/page-header';
import { LockStateService } from './core/services/lock-state.service';
import { AppSettingsRepository } from './core/repositories';
import { NotificationService } from './core/services/notification.service'; // 👈 nuevo

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastModule, PageFooter, PageHeader],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  private router = inject(Router);
  private lockState = inject(LockStateService);
  private appSettingsRepo = inject(AppSettingsRepository);
  private notificationService = inject(NotificationService); // 👈 nuevo
  protected readonly title = signal('mood-tracker');

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => (e as NavigationEnd).urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  showChrome = computed(() => {
    const url = this.currentUrl();
    return !url.startsWith('/setup') && !url.startsWith('/lock');
  });

  private handleVisibilityChange = async (): Promise<void> => {
    if (document.hidden) {
      this.lockState.lock();
      return;
    }

    const setupCompleted = await this.appSettingsRepo.isSetupCompleted();
    if (setupCompleted && !this.lockState.unlocked()) {
      this.router.navigate(['/lock']);
    }

    // vuelve a foreground: recalcula recordatorios por si cambió el día
    await this.notificationService.rescheduleAll(); // 👈 nuevo
  };

  async ngOnInit(): Promise<void> {
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    // solo pide permiso y programa recordatorios si el setup ya está hecho
    const setupCompleted = await this.appSettingsRepo.isSetupCompleted();
    if (setupCompleted) {
      await this.notificationService.initialize(); // 👈 nuevo
    }
  }

  ngOnDestroy(): void {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }
}