import { Component, signal, inject, computed } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { ToastModule } from 'primeng/toast';
import { PageFooter } from './layout/page-footer/page-footer';
import { PageHeader } from './layout/page-header/page-header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastModule, PageFooter, PageHeader],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private router = inject(Router);
  protected readonly title = signal('mood-tracker');

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => (e as NavigationEnd).urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  showChrome = computed(() => !this.currentUrl().startsWith('/setup'));
}