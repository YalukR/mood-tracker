import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule, NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavItem } from '../../core/models/common.model';
import { SlidingIndicator } from '../../shared/sliding-indicator';

@Component({
  selector: 'app-page-footer',
  standalone: true,
  imports: [RouterModule, SlidingIndicator], // 👈 agregado
  templateUrl: './page-footer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageFooter {
  private router = inject(Router);

  items: NavItem[] = this.router.config
    .filter(route => route.data?.['icon'] && route.data?.['label'])
    .map(route => ({
      path: `/${route.path}`,
      icon: route.data!['icon'],
      label: route.data!['label'],
    }));

  active = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => (e as NavigationEnd).urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  // 👈 agregado — faltaba esto, por eso el TS2339
  activeIndex = computed(() =>
    Math.max(0, this.items.findIndex(i => i.path === this.active()))
  );
}