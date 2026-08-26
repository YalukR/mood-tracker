import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

function showFatalErrorOverlay(err: unknown): void {
  const message = err instanceof Error ? `${err.name}: ${err.message}\n\n${err.stack}` : String(err);

  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: #1a0f0f;
    color: #ffb3b3;
    font-family: monospace;
    font-size: 12px;
    line-height: 1.5;
    padding: 20px;
    z-index: 999999;
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-word;
  `;
  overlay.textContent = `⚠️ Error fatal al iniciar la app:\n\n${message}`;
  document.body.appendChild(overlay);
}

// También captura errores que no vienen del bootstrap (promesas sin catch en cualquier parte)
window.addEventListener('unhandledrejection', (event) => {
  console.error('[unhandledrejection]', event.reason);
  showFatalErrorOverlay(event.reason);
});

window.addEventListener('error', (event) => {
  console.error('[window error]', event.error ?? event.message);
  showFatalErrorOverlay(event.error ?? event.message);
});

bootstrapApplication(App, appConfig)
  .catch((err) => {
    console.error(err);
    showFatalErrorOverlay(err);
  });