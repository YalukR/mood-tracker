import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-sliding-indicator',
  standalone: true,
  template: `
    <div class="indicator-track" [style.width.%]="100 / count()" [style.transform]="transform()">
      <div class="indicator-shape" [class]="shapeClass()"></div>
    </div>
  `,
  styles: [`
    :host {
      position: absolute;
      inset: 0;
      z-index: 0;
      pointer-events: none;
    }
    .indicator-track {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
      will-change: transform;
    }
    /* :where() tiene especificidad CERO — es solo un valor por defecto.
       Cualquier clase de Tailwind pasada en shapeClass (h-7, w-7, etc.)
       siempre gana, sin importar el orden de carga de las hojas de estilo. */
    :where(.indicator-shape) {
      width: 100%;
      height: 100%;
      flex-shrink: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlidingIndicator {
  count = input.required<number>();
  activeIndex = input.required<number>();
  /** Clases Tailwind para la forma/color del indicador (ej. círculo del footer o pill del selector) */
  shapeClass = input<string>('');

  transform = computed(() => `translateX(${this.activeIndex() * 100}%)`);
}