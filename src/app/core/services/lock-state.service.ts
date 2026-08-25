import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LockStateService {
  /** true = ya se ingresó la contraseña correcta en esta sesión de la app */
  private _unlocked = signal(false);
  unlocked = this._unlocked.asReadonly();

  unlockSession(): void {
    this._unlocked.set(true);
  }

  lock(): void {
    this._unlocked.set(false);
  }
}