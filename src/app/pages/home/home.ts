import { Component, signal } from '@angular/core';
import { MoodForm } from './mood-form/mood-form';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MoodForm],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  showForm = signal(false);

  openForm(): void {
    this.showForm.set(true);
  }

  onSaved(): void {
    this.showForm.set(false);
    // Aquí luego recargamos el historial del día / refrescamos la mascota
  }

  onCancelled(): void {
    this.showForm.set(false);
  }
}