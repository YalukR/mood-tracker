import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppSettingsRepository } from '../../core/repositories';
import { getRandomGreeting } from '../../core/utils/greetings.util';
import { getRandomCuriosityFact } from '../../core/utils/curiosity-facts.util';
import { Pet } from '../../shared/pet/pet';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, Pet],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private appSettingsRepo = inject(AppSettingsRepository);

  greeting = signal('');
  curiosityFact = signal('');

  /** controla la entrada en cascada del contenido al abrir Home */
  ready = signal(false);

  async ngOnInit(): Promise<void> {
    const name = await this.appSettingsRepo.getUsername();
    this.greeting.set(getRandomGreeting(name ?? ''));
    this.curiosityFact.set(getRandomCuriosityFact());

    // doble rAF: asegura que el navegador pinte el estado inicial (oculto)
    // antes de disparar la transición, si no a veces se salta la animación
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.ready.set(true));
    });
  }
}