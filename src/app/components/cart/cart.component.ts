import { Component, OnInit, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TripDetailsComponent } from '../trip-details/trip-details.component';
import { PaymentService } from '../../services/payment.service';
import { finalize, take } from 'rxjs/operators';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PaymentConfirmationComponent } from '../payment-confirmation/payment-confirmation.component';

// Este componente es el carrito de la web, donde ves los viajes que tienes reservados y puedes pagar

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    CurrencyPipe,
    MatProgressSpinnerModule,
    TripDetailsComponent
  ],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  // Aquí guardamos los viajes reservados, el precio total, si está cargando, si hay error, y si es cuenta de empresa
  reservedTrips = signal<any[]>([]);
  totalPrice = signal<number>(0);
  isLoading = signal<boolean>(false);
  paymentError = signal<string | null>(null);
  isBusinessAccount = signal<boolean>(false);
  
  // Guardamos los servicios que vamos a usar, como los de pagos, usuarios, etc.
  private dialog = inject(MatDialog);
  private paymentService = inject(PaymentService);
  private authService = inject(AuthService);

  constructor(
    private cartService: CartService,
    private router: Router
  ) { 
    // Cada vez que cambia el usuario (por ejemplo, inicia sesión), miramos si es empresa y cargamos sus reservas
    this.authService.authStatus$.subscribe(() => {
      this.isBusinessAccount.set(this.authService.isCompany());
      if (this.authService.authStatus$.value.isAuthenticated) {
        this.loadReservations();
      }
    });
  }

  ngOnInit(): void {
    // Al iniciar, miramos si es empresa y cargamos reservas si está logueado
    this.isBusinessAccount.set(this.authService.isCompany());
    
    if (this.authService.authStatus$.value.isAuthenticated) {
      this.loadReservations();
    }
    this.setupCacheSync(); // Preparamos para que el carrito se mantenga actualizado
  }

  // Calcula cuánto se ahorra una empresa por los descuentos
  calculateSavings(): number {
    if (!this.isBusinessAccount()) return 0;
    
    return this.reservedTrips().reduce((total, trip) => {
      return total + (trip.originalPrice - trip.price) * trip.quantity;
    }, 0);
  }

  // Esto ayuda a que Angular sepa qué viaje es cuál en la lista
  trackByTripId(index: number, trip: any): number {
    return trip.id;
  }

  // Prepara para que el carrito se actualice si cambia en otra pestaña
  private setupCacheSync(): void {
    window.addEventListener('storage', (event) => {
      if (event.key === 'cart_reservations') {
        this.loadFromCache();
      }
    });
  }

  // Carga los datos del carrito guardados en el navegador
  private loadFromCache(): void {
    const cached = localStorage.getItem('cart_reservations');
    if (cached) {
      const data = JSON.parse(cached);
      // Mantenemos el precio que ya tenía el viaje
      const tripsWithDiscount = data.reservations.map((trip: any) => ({
        ...trip,
        price: trip.price
      }));
      this.reservedTrips.set(tripsWithDiscount);
      this.totalPrice.set(data.totalPrice);
    }
  }

  // Guarda el carrito en el navegador
  private saveToCache(): void {
    localStorage.setItem('cart_reservations', JSON.stringify({
      reservations: this.reservedTrips(),
      totalPrice: this.totalPrice()
    }));
    window.dispatchEvent(new Event('storage'));
  }

  // Calcula el precio total sumando el precio de cada viaje por la cantidad
  private calculateTotal(trips: any[]): number {
    return trips.reduce((total, trip) => {
      return total + (trip.price * trip.quantity);
    }, 0);
  }

  // Carga las reservas del usuario desde el servidor
  loadReservations(): void {
    this.isLoading.set(true);
    const userId = this.authService.authStatus$.value?.userData?.id;
    
    if (userId) {
      this.authService.getReservedTrips(userId)
        .pipe(
          take(1),
          finalize(() => this.isLoading.set(false))
        )
        .subscribe({
          next: (reservations) => {
            // Agrupa las reservas por viaje y aplica descuento si es empresa
            const grouped = this.groupReservations(reservations);
            const discountedTrips = this.applyBusinessDiscount(grouped);
            this.reservedTrips.set(discountedTrips);
            this.totalPrice.set(this.calculateTotal(discountedTrips));
            this.saveToCache();
          },
          error: (err) => {
            console.error('Error loading reservations:', err);
            this.paymentError.set('Error al cargar las reservas');
          }
        });
    }
  }

  // Si es empresa, aplica un descuento al precio de cada viaje
  private applyBusinessDiscount(trips: any[]): any[] {
    return trips.map(trip => ({
      ...trip,
      originalPrice: trip.price,
      price: this.isBusinessAccount() ? trip.price * 0.85 : trip.price
    }));
  }

  // Junta las reservas del mismo viaje y suma la cantidad
  private groupReservations(reservations: any[]): any[] {
    const grouped: { [key: number]: any } = {};
    
    reservations.forEach(res => {
      if (!grouped[res.trip_id]) {
        grouped[res.trip_id] = { 
          ...res.trip, 
          quantity: 0,
          reservation_ids: []
        };
      }
      grouped[res.trip_id].quantity += res.quantity;
      grouped[res.trip_id].reservation_ids.push(res.id);
    });
    
    return Object.values(grouped);
  }

  // Muestra los detalles de un viaje en una ventana emergente
  viewTripDetails(trip: any): void {
    this.dialog.open(TripDetailsComponent, {
      panelClass: 'custom-dialog-container',
      data: { trip: trip },
      width: '80vw',
      maxWidth: '800px'
    });
  }

  // Cuando el usuario quiere pagar, se procesa el pago
  processPayment(): void {
    this.isLoading.set(true);
    this.paymentError.set(null);
  
    const paymentData = {
      user_id: this.authService.authStatus$.value?.userData?.id,
      reservations: this.reservedTrips().flatMap(trip => 
        trip.reservation_ids.map((id: number) => ({
          reservation_id: id,
          amount: trip.price
        }))
      ),
      total_amount: this.totalPrice()
    };
  
    this.paymentService.processPayment(paymentData)
      .pipe(
        take(1),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response: any) => {
          localStorage.removeItem('cart_reservations');
          
          // Abre una ventana de confirmación de pago
          const dialogRef = this.dialog.open(PaymentConfirmationComponent, {
            width: '500px',
            data: { paymentResponse: response },
            disableClose: true // No se puede cerrar haciendo clic fuera
          });
  
          // Cuando se cierra la ventana, volvemos al inicio
          dialogRef.afterClosed().subscribe(() => {
            this.router.navigate(['/']);
          });
        },
        error: (err) => {
          console.error('Payment error:', err);
          this.paymentError.set(err.error?.message || 'Error al procesar el pago');
        }
      });
  }

  // Recarga el carrito (por ejemplo, si se ha actualizado algo)
  refreshCart(): void {
    this.loadReservations();
  }
}