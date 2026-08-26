import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PageTitleService {
  /** Título dinámico que una página puede "mandarle" al header, o null para usar el estático de la ruta */
  private _override = signal<string | null>(null);
  override = this._override.asReadonly();

  /** Ruta a la que debe navegar el botón de volver, o null para no mostrarlo */
  private _backPath = signal<string | null>(null);
  backPath = this._backPath.asReadonly();

  setTitle(title: string): void {
    this._override.set(title);
  }

  setBackPath(path: string): void {
    this._backPath.set(path);
  }

  /** Se debe llamar al salir de la página que los estableció, para no dejar título/back viejos pegados */
  clear(): void {
    this._override.set(null);
    this._backPath.set(null);
  }
}