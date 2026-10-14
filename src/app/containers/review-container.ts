import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Analytics } from '../analytics/analytics';
import { ItineraryLegSummary } from '../components/review/itinerary-leg-summary';
import { PassengerListSummary } from '../components/review/passenger-list-summary';
import { PriceSummary } from '../components/review/price-summary';
import { ButtonDirective } from '../components/ui/button';
import { computePriceBreakdown, findFareFamily, findOffer } from '../lib/pricing';
import { BookingFlowStore } from '../stores/booking-flow.store';
import { JourneyStore } from '../stores/journey.store';

/**
 * RF-08: step 4 — review itinerary, passengers and price composition before
 * payment. Purely derived from state already gathered in earlier steps, so it
 * needs no mock-api call of its own.
 */
@Component({
  selector: 'app-review-container',
  imports: [ButtonDirective, ItineraryLegSummary, PassengerListSummary, PriceSummary],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './review-container.html',
})
export class ReviewContainer implements OnInit {
  private readonly analytics = inject(Analytics);
  private readonly flow = inject(BookingFlowStore);
  private readonly journey = inject(JourneyStore);
  private readonly router = inject(Router);

  protected readonly passengers = this.flow.passengers;

  protected readonly outboundOffer = computed(() =>
    findOffer(this.flow.results()!.outboundOffers, this.flow.selectedTrip()!.outboundFlightNumber),
  );
  protected readonly outboundFare = computed(() =>
    findFareFamily(this.outboundOffer(), this.flow.selectedTrip()!.outboundFareFamilyId),
  );
  protected readonly inboundOffer = computed(() =>
    findOffer(this.flow.results()!.inboundOffers, this.flow.selectedTrip()!.inboundFlightNumber),
  );
  protected readonly inboundFare = computed(() =>
    findFareFamily(this.inboundOffer(), this.flow.selectedTrip()!.inboundFareFamilyId),
  );

  protected readonly breakdown = computed(() =>
    computePriceBreakdown({
      results: this.flow.results()!,
      selectedTrip: this.flow.selectedTrip()!,
      passengerCount: this.flow.passengers()!.length,
    }),
  );

  ngOnInit(): void {
    this.analytics.trackBookingReviewViewed({
      bookingId: this.journey.bookingId()!,
      breakdown: this.breakdown(),
    });
  }

  protected async onConfirm(): Promise<void> {
    this.analytics.trackBookingDetailsConfirmed({
      bookingId: this.journey.bookingId()!,
      totalAmount: this.breakdown().grandTotal,
    });
    await this.router.navigate(['/pagamento']);
  }
}
