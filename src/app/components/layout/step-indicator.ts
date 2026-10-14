import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export const BOOKING_STEPS = [
  { path: '/buscar', label: 'Busca' },
  { path: '/selecionar', label: 'Voos' },
  { path: '/passageiros', label: 'Passageiros' },
  { path: '/revisao', label: 'Revisão' },
  { path: '/pagamento', label: 'Pagamento' },
  { path: '/confirmacao', label: 'Confirmação' },
];

@Component({
  selector: 'app-step-indicator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './step-indicator.html',
})
export class StepIndicator {
  readonly currentPath = input.required<string>();
  readonly logoClick = output<void>();

  protected readonly steps = BOOKING_STEPS;

  protected readonly currentIndex = computed(() =>
    BOOKING_STEPS.findIndex((step) => step.path === this.currentPath()),
  );
}
