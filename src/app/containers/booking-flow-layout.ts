import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { Analytics, type BookingStep, type ScreenName } from '../analytics/analytics';
import { StepIndicator } from '../components/layout/step-indicator';
import { AlertDialog } from '../components/ui/alert-dialog';
import { ButtonDirective } from '../components/ui/button';
import { BookingFlowStore } from '../stores/booking-flow.store';

/**
 * Screen Viewed: booking_step/screen_name per route. Every step of the funnel
 * is a child route of this layout, so it's the single place that sees every
 * navigation — one tracking call here instead of one per container.
 */
const SCREEN_BY_PATH: Record<string, { screenName: ScreenName; bookingStep: BookingStep }> = {
  '/buscar': { screenName: 'home', bookingStep: 'search' },
  '/selecionar': { screenName: 'flight_selection', bookingStep: 'select' },
  '/passageiros': { screenName: 'passenger_details', bookingStep: 'passenger' },
  '/revisao': { screenName: 'booking_review', bookingStep: 'review' },
  '/pagamento': { screenName: 'payment', bookingStep: 'payment' },
  '/confirmacao': { screenName: 'confirmation', bookingStep: 'confirmation' },
};

/**
 * Flow shell: step indicator, restart confirmation and the one place that sees
 * every navigation, so Screen Viewed is tracked here instead of in each step.
 * The flow's step-to-step data lives in BookingFlowStore, provided on this
 * component's route — the exception is the journey correlation IDs, which are
 * global to the journey and live in JourneyStore per specs.md §4.2.
 */
@Component({
  selector: 'app-booking-flow-layout',
  imports: [AlertDialog, ButtonDirective, RouterOutlet, StepIndicator],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './booking-flow-layout.html',
})
export class BookingFlowLayout {
  private readonly analytics = inject(Analytics);
  private readonly router = inject(Router);
  private readonly flow = inject(BookingFlowStore);

  protected readonly currentPath = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects.split('?')[0]),
    ),
    { initialValue: this.router.url.split('?')[0] },
  );

  protected readonly showRestartDialog = signal(false);

  private referrerScreen: ScreenName | undefined;

  constructor() {
    effect(() => {
      const screen = SCREEN_BY_PATH[this.currentPath()];
      if (!screen) return;

      this.analytics.trackScreenViewed({
        screenName: screen.screenName,
        bookingStep: screen.bookingStep,
        referrerScreen: this.referrerScreen,
      });
      this.referrerScreen = screen.screenName;
    });
  }

  protected onLogoClick(): void {
    this.analytics.trackLogoClicked({
      screenName: SCREEN_BY_PATH[this.currentPath()]?.screenName,
    });

    // A journey in progress is lost by restarting, so ask first. A completed
    // journey (order issued) has nothing to lose — reset and go.
    if (this.flow.criteria() && !this.flow.order()) {
      this.showRestartDialog.set(true);
      return;
    }

    if (this.flow.order()) {
      this.flow.resetFlow();
    }
    void this.router.navigate(['/']);
  }

  protected confirmRestart(): void {
    this.showRestartDialog.set(false);
    this.flow.resetFlow();
    void this.router.navigate(['/']);
  }
}
