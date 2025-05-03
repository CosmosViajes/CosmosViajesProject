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
    title: 'Lista de vuelos'
  },
  {
    path: 'login',
    component: LoginDialogComponent,
    title: 'Iniciar sesión'
  },
  {
    path: 'payments-history',
    component: PaymentsHistoryComponent ,
    title: 'Pagos'
  },
  {
    path: 'register',
    component: RegisterDialogComponent,
    title: 'Registrarse'
  },
  {
    path: 'cart',
    component: CartComponent,
    title: 'Carrito'
  },
  {
    path: 'empresas',
    component: ProviderListComponent,
    title: 'Empresas'
  },
  { 
    path: 'experiencias',
    component: ExperienciasComponent 
  }
];