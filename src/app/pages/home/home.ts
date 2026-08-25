import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppSettingsRepository } from '../../core/repositories';
import { getRandomGreeting } from '../../core/utils/greetings.util';
import { Pet } from './pet/pet';

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

  async ngOnInit(): Promise<void> {
    const name = await this.appSettingsRepo.getUsername();
    this.greeting.set(getRandomGreeting(name ?? ''));
  }
}