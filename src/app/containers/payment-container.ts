import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AlertTriangle, LucideAngularModule } from 'lucide-angular';
import { Analytics } from '../analytics/analytics';
import { PaymentForm, type MethodSelection } from '../components/payment/payment-form';
import {
  AlertDescriptionDirective,
  AlertDirective,
  AlertTitleDirective,
} from '../components/ui/alert';
import { computePriceBreakdown } from '../lib/pricing';
import { BookingFlowStore } from '../stores/booking-flow.store';
import { JourneyStore } from '../stores/journey.store';
import { PaymentStore } from '../stores/payment.store';
import type { PaymentDetails } from '../types/domain';

/** RF-09/10/11/12, RS-02: step 5 — payment authorization. */
@Component({
  selector: 'app-payment-container',
  imports: [
    AlertDescriptionDirective,
    AlertDirective,
    AlertTitleDirective,
    LucideAngularModule,
    PaymentForm,
  ],
  providers: [PaymentStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payment-container.html',
})
export class PaymentContainer {
  private readonly analytics = inject(Analytics);
  private readonly flow = inject(BookingFlowStore);
  private readonly journey = inject(JourneyStore);
  private readonly router = inject(Router);
  private readonly payment = inject(PaymentStore);

  protected readonly status = this.payment.status;
  protected readonly error = this.payment.error;
  protected readonly AlertTriangleIcon = AlertTriangle;

  protected readonly breakdown = computed(() =>
    computePriceBreakdown({
      results: this.flow.results()!,
      selectedTrip: this.flow.selectedTrip()!,
      passengerCount: this.flow.passengers()!.length,
    }),
  );

  private attemptCount = 0;

  protected onMethodSelected({ method, milesUsedCount }: MethodSelection): void {
    this.analytics.trackPaymentMethodSelected({
      bookingId: this.journey.bookingId()!,
      method,
      milesUsedCount,
    });
  }

  protected async onPay(payment: PaymentDetails): Promise<void> {
    this.attemptCount += 1;
    const bookingId = this.journey.bookingId()!;
    const breakdown = this.breakdown();

    // Intent event on submit; the outcome pair below fires only from the
    // mock-api's actual response — never optimistically.
    this.analytics.trackPaymentDetailsSubmitted({
      bookingId,
      payment,
      totalAmount: breakdown.grandTotal,
    });

    const { order, error } = await this.payment.pay({ bookingId, payment });

    if (!order) {
      this.analytics.trackPaymentFailed({
        bookingId,
        payment,
        totalAmount: breakdown.grandTotal,
        attemptCount: this.attemptCount,
        mockErrorType: error?.type,
      });
      return;
    }

    this.analytics.trackPurchaseCompleted({
      order,
      criteria: this.flow.criteria()!,
      results: this.flow.results()!,
      selectedTrip: this.flow.selectedTrip()!,
      passengers: this.flow.passengers()!,
      payment,
      breakdown,
    });

    this.flow.order.set(order);
    await this.router.navigate(['/confirmacao']);
  }
}
