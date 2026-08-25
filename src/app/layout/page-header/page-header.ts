import { Component, inject, computed } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { PageTitleService } from '../../core/services/page-title.service';

interface HeaderIcon {
  path: string;
  icon: string;
}

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './page-header.html',
  styleUrl: './page-header.css',
})
export class PageHeader {
  private router = inject(Router);
  private pageTitleService = inject(PageTitleService);

  icons: HeaderIcon[] = this.router.config
    .filter(route => route.data?.['headerIcon'])
    .map(route => ({
      path: `/${route.path}`,
      icon: route.data!['headerIcon'],
    }));

  private titleMap = new Map<string, string>(
    this.router.config
      .filter(route => route.data?.['title'])
      .map(route => [`/${route.path}`, route.data!['title'] as string])
  );

  private activeUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => (e as NavigationEnd).urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  /** El título dinámico (si alguna página lo mandó) gana sobre el estático de la ruta */
  title = computed(() => this.pageTitleService.override() ?? this.titleMap.get(this.activeUrl()) ?? '');

  /** Solo se muestra la flecha si la página activa mandó una ruta de vuelta */
  backPath = computed(() => this.pageTitleService.backPath());

  goBack(): void {
    const path = this.backPath();
    if (path) this.router.navigate([path]);
  }
}