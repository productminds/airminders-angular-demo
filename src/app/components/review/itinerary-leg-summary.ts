import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideAngularModule, Plane } from 'lucide-angular';
import { CardContentDirective, CardDirective } from '../ui/card';
import { formatDate, formatDuration, formatStops, formatTime } from '../../lib/format';
import type { FareFamily, FlightOffer } from '../../types/domain';

@Component({
  selector: 'app-itinerary-leg-summary',
  imports: [CardContentDirective, CardDirective, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './itinerary-leg-summary.html',
})
export class ItineraryLegSummary {
  readonly title = input.required<string>();
  readonly offer = input.required<FlightOffer>();
  readonly fareFamily = input.required<FareFamily>();

  protected readonly PlaneIcon = Plane;
  protected readonly formatDate = formatDate;
  protected readonly formatDuration = formatDuration;
  protected readonly formatStops = formatStops;
  protected readonly formatTime = formatTime;
}
