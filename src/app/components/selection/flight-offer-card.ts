import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideAngularModule, Plane } from 'lucide-angular';
import { CardContentDirective, CardDirective } from '../ui/card';
import { cn } from '../../lib/utils';
import { formatCurrency, formatDuration, formatStops, formatTime } from '../../lib/format';
import type { FlightOffer } from '../../types/domain';

export interface FareSelection {
  flightNumber: string;
  fareFamilyId: string;
}

/**
 * RF-03/05/06: one flight offer with its per-fare-family prices. Selecting a
 * fare family button chooses both the flight and the fare for this leg.
 */
@Component({
  selector: 'app-flight-offer-card',
  imports: [CardContentDirective, CardDirective, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './flight-offer-card.html',
})
export class FlightOfferCard {
  readonly offer = input.required<FlightOffer>();
  readonly selectedFareFamilyId = input<string | null>(null);
  readonly selectFare = output<FareSelection>();

  protected readonly PlaneIcon = Plane;
  protected readonly formatCurrency = formatCurrency;
  protected readonly formatDuration = formatDuration;
  protected readonly formatStops = formatStops;
  protected readonly formatTime = formatTime;

  protected fareButtonClass(fareFamilyId: string): string {
    return cn(
      'rounded-md border p-3 text-left transition-colors',
      this.selectedFareFamilyId() === fareFamilyId
        ? 'border-primary bg-primary/10'
        : 'border-border hover:border-primary/50',
    );
  }
}
