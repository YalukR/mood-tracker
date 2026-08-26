import { Component, signal, computed, inject } from '@angular/core';
import { Theme } from './theme/theme';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [Theme],
  templateUrl: './settings.html',
})
export class Settings {

}