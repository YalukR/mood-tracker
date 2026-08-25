import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PasswordPromptService {
  visible = signal(false);
  private resolver: ((ok: boolean) => void) | null = null;

  /** Pide contraseña; se resuelve true si el usuario la acertó, false si canceló. */
  request(): Promise<boolean> {
    this.visible.set(true);
    return new Promise<boolean>((resolve) => {
      this.resolver = resolve;
    });
  }

  resolve(ok: boolean): void {
    this.visible.set(false);
    this.resolver?.(ok);
    this.resolver = null;
  }
}