import { Component, signal, inject, computed, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { ToastModule } from 'primeng/toast';
import { App as CapacitorApp } from '@capacitor/app';
import { PluginListenerHandle } from '@capacitor/core';
import { PageFooter } from './layout/page-footer/page-footer';
import { PageHeader } from './layout/page-header/page-header';
import { LockStateService } from './core/services/lock-state.service';
import { AppSettingsRepository } from './core/repositories';

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
  protected readonly title = signal('mood-tracker');

  private listenerHandle: PluginListenerHandle | null = null;

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

  async ngOnInit(): Promise<void> {
    this.listenerHandle = await CapacitorApp.addListener('appStateChange', async ({ isActive }) => {
      if (!isActive) {
        // se va a background: bloquea la sesión
        this.lockState.lock();
        return;
      }

      // vuelve a foreground: si hay password configurada y sigue bloqueada, manda al lock
      const setupCompleted = await this.appSettingsRepo.isSetupCompleted();
      if (setupCompleted && !this.lockState.unlocked()) {
        this.router.navigate(['/lock']);
      }
    });
  }

  ngOnDestroy(): void {
    this.listenerHandle?.remove();
  }
}