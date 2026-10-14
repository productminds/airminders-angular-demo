import { inject } from '@angular/core';
import { type CanActivateFn, RedirectCommand, Router } from '@angular/router';
import { BookingFlowStore } from '../stores/booking-flow.store';

/**
 * Each step needs the data the steps before it produced. The React original
 * rendered a <Navigate> from inside the screen; a route guard keeps the check
 * out of the component and off the render path. BookingFlowStore is resolvable
 * here because BookingFlowLayout provides it on the parent route.
 */
function redirectUnless(hasData: boolean, fallback: string): true | RedirectCommand {
  if (hasData) return true;
  return new RedirectCommand(inject(Router).parseUrl(fallback));
}

/** Steps 2+: a search must have produced results. */
export const requireResults: CanActivateFn = () => {
  const flow = inject(BookingFlowStore);
  return redirectUnless(Boolean(flow.criteria() && flow.results()), '/buscar');
};

/** Step 3: a flight and fare must be chosen for every leg. */
export const requireSelectedTrip: CanActivateFn = () => {
  const flow = inject(BookingFlowStore);
  return redirectUnless(
    Boolean(flow.criteria() && flow.results() && flow.selectedTrip()),
    '/selecionar',
  );
};

/** Steps 4-5: passenger details must be submitted and accepted. */
export const requirePassengers: CanActivateFn = () => {
  const flow = inject(BookingFlowStore);
  return redirectUnless(
    Boolean(flow.criteria() && flow.results() && flow.selectedTrip() && flow.passengers()),
    '/buscar',
  );
};

/** Step 6: only reachable once the mock-api confirmed the payment. */
export const requireOrder: CanActivateFn = () => {
  const flow = inject(BookingFlowStore);
  return redirectUnless(
    Boolean(flow.results() && flow.selectedTrip() && flow.passengers() && flow.order()),
    '/buscar',
  );
};
