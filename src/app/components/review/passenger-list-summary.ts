import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CardContentDirective, CardDirective } from '../ui/card';
import type { Passenger } from '../../types/domain';

@Component({
  selector: 'app-passenger-list-summary',
  imports: [CardContentDirective, CardDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div appCard>
      <div appCardContent class="p-4 sm:p-5">
        <h2 class="text-lg font-semibold">Passageiros</h2>
        <ul class="mt-3 space-y-1 text-sm">
          @for (passenger of passengers(); track passenger.passengerId; let index = $index) {
            <li class="text-foreground">
              {{ index + 1 }}. {{ passenger.firstName }} {{ passenger.lastName }}
            </li>
          }
        </ul>
      </div>
    </div>
  `,
})
export class PassengerListSummary {
  readonly passengers = input.required<Passenger[]>();
}
