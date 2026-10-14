import { Routes } from '@angular/router';
import { BookingFlowStore } from './stores/booking-flow.store';
import { BookingFlowLayout } from './containers/booking-flow-layout';
import { ConfirmationContainer } from './containers/confirmation-container';
import { PassengersContainer } from './containers/passengers-container';
import { PaymentContainer } from './containers/payment-container';
import { ReviewContainer } from './containers/review-container';
import { SearchContainer } from './containers/search-container';
import { SelectionContainer } from './containers/selection-container';
import {
  requireOrder,
  requirePassengers,
  requireResults,
  requireSelectedTrip,
} from './guards/step-guards';

/** The six steps of specs.md §3.1, all children of the flow layout. */
export const routes: Routes = [
  {
    path: '',
    component: BookingFlowLayout,
    // Provided on the route, not on the layout component: this is an
    // environment injector, so the step guards below resolve the same instance
    // the screens use. It lives as long as the flow route stays activated.
    providers: [BookingFlowStore],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'buscar' },
      { path: 'buscar', component: SearchContainer },
      { path: 'selecionar', component: SelectionContainer, canActivate: [requireResults] },
      { path: 'passageiros', component: PassengersContainer, canActivate: [requireSelectedTrip] },
      { path: 'revisao', component: ReviewContainer, canActivate: [requirePassengers] },
      { path: 'pagamento', component: PaymentContainer, canActivate: [requirePassengers] },
      { path: 'confirmacao', component: ConfirmationContainer, canActivate: [requireOrder] },
      { path: '**', redirectTo: 'buscar' },
    ],
  },
];
