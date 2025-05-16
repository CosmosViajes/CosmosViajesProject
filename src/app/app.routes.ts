import { Routes } from '@angular/router';
import { FlightsListComponent } from './components/flights-list/flights-list.component';
import { LoginDialogComponent } from './components/login-dialog/login-dialog.component';
import { RegisterDialogComponent } from './components/register-dialog/register-dialog.component';
import { CartComponent  } from './components/cart/cart.component';
import { ExperienciasComponent } from './components/experiencias/experiencias.component';
import { ProviderListComponent } from './components/provider-list/provider-list.component';
import { PaymentsHistoryComponent } from './components/payments-history/payments-history.component';

export const routes: Routes = [
  { 
    path: '', 
    component: FlightsListComponent,
    title: 'CosmoViajes+'
  },
  {
    path: 'login',
    component: LoginDialogComponent
  },
  {
    path: 'payments-history',
    component: PaymentsHistoryComponent
  },
  {
    path: 'register',
    component: RegisterDialogComponent
  },
  {
    path: 'cart',
    component: CartComponent
  },
  {
    path: 'empresas',
    component: ProviderListComponent
  },
  { 
    path: 'experiencias',
    component: ExperienciasComponent
  }
];