import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
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
  protected readonly title = signal('mood-tracker');
}