import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { PageFooter } from './layout/page-footer/page-footer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastModule, PageFooter],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('mood-tracker');
}
