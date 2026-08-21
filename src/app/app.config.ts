import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es-MX';
import { routes } from './app.routes';
import { providePrimeNG } from 'primeng/config';
import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';
import { MessageService } from 'primeng/api';

registerLocaleData(localeEs);

const MyPreset = definePreset(Aura, {
  semantic: {
    primary: {
      // Escala lavanda — modo CLARO
      50: '#f6f4fc',
      100: '#ece7f8',
      200: '#d5cbef',
      300: '#bdafe6',
      400: '#a692da',
      500: '#8b7ec8',
      600: '#7268ac',
      700: '#5a5390',
      800: '#443f70',
      900: '#302c52',
      950: '#1e1b38',
    },
    colorScheme: {
      light: {
        surface: {
          0: '#fbf3e8',
          50: '#f2e6d4',
          100: '#ecdcc4',
          200: '#e3d3ba',
          300: '#d1bd9e',
          400: '#ac9678',
          500: '#94816c',
          600: '#786652',
          700: '#5c4d3d',
          800: '#3a2f24',
          900: '#291f17',
          950: '#1a130d',
        },
      },
      dark: {
        // Superficies cálidas oscuras (morado-carbón, no gris VSCode)
        surface: {
          0: '#18141f',
          50: '#221d2c',   // fondo base
          100: '#2a2434',
          200: '#2e2738',  // línea resaltada / hover
          300: '#453a58',  // selección / bordes
          400: '#574a6c',
          500: '#a89bb8',  // texto apagado
          600: '#c2b8d0',
          700: '#d8d0e2',
          800: '#ebe6f0',
          900: '#f5f2f8',
          950: '#faf8fc',
        },
        // Acento primario oscuro: lavanda clara
        primary: {
          color: '#b3a4e8',
          contrastColor: '#18141f',
          hoverColor: '#c2b6ee',
          activeColor: '#a290e0',
        },
      },
    },
  },
});

// Direcciones posibles del slide, elegidas al azar en cada navegación
const SLIDE_DIRECTIONS = ['slide-left', 'slide-right', 'slide-up', 'slide-down'] as const;

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withViewTransitions({
        onViewTransitionCreated: ({ transition }) => {
          const direction =
            SLIDE_DIRECTIONS[Math.floor(Math.random() * SLIDE_DIRECTIONS.length)];

          document.documentElement.setAttribute('data-transition', direction);

          transition.finished.finally(() => {
            document.documentElement.removeAttribute('data-transition');
          });
        },
      })
    ),
    provideAnimationsAsync(),
    { provide: LOCALE_ID, useValue: 'es-MX' },
    providePrimeNG({
      theme: {
        preset: MyPreset,
        options: {
          darkModeSelector: '.dark',
        },
      },
    }),

    MessageService,
  ],
};