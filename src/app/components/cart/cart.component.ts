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
  reservedTrips = signal<any[]>([]);
  totalPrice = signal<number>(0);
  isLoading = signal<boolean>(false);
  paymentError = signal<string | null>(null);
  isBusinessAccount = signal<boolean>(false);
  
  private dialog = inject(MatDialog);
  private paymentService = inject(PaymentService);
  private authService = inject(AuthService);

  constructor(
    private cartService: CartService,
    private router: Router
  ) { 
    this.authService.authStatus$.subscribe(() => {
      this.isBusinessAccount.set(this.authService.isCompany());
      if (this.authService.authStatus$.value.isAuthenticated) {
        this.loadReservations();
      }
    });
  }

  ngOnInit(): void {
    this.isBusinessAccount.set(this.authService.isCompany());
    
    if (this.authService.authStatus$.value.isAuthenticated) {
      this.loadReservations();
    }
    this.setupCacheSync();
  }

  calculateSavings(): number {
    if (!this.isBusinessAccount()) return 0;
    
    return this.reservedTrips().reduce((total, trip) => {
      return total + (trip.originalPrice - trip.price) * trip.quantity;
    }, 0);
  }

  trackByTripId(index: number, trip: any): number {
    return trip.id;
  }

  private setupCacheSync(): void {
    window.addEventListener('storage', (event) => {
      if (event.key === 'cart_reservations') {
        this.loadFromCache();
      }
    });
  }

  private loadFromCache(): void {
    const cached = localStorage.getItem('cart_reservations');
    if (cached) {
      const data = JSON.parse(cached);
      // Solo aplicar descuento si no está ya aplicado
      const tripsWithDiscount = data.reservations.map((trip: any) => ({
        ...trip,
        price: trip.price // Mantener el precio ya descontado del caché
      }));
      this.reservedTrips.set(tripsWithDiscount);
      this.totalPrice.set(data.totalPrice);
    }
  }

  private saveToCache(): void {
    localStorage.setItem('cart_reservations', JSON.stringify({
      reservations: this.reservedTrips(),
      totalPrice: this.totalPrice()
    }));
    window.dispatchEvent(new Event('storage'));
  }

  private calculateTotal(trips: any[]): number {
    return trips.reduce((total, trip) => {
      return total + (trip.price * trip.quantity);
    }, 0);
  }

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

  private applyBusinessDiscount(trips: any[]): any[] {
    return trips.map(trip => ({
      ...trip,
      originalPrice: trip.price,
      price: this.isBusinessAccount() ? trip.price * 0.85 : trip.price
    }));
  }

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

  viewTripDetails(trip: any): void {
    this.dialog.open(TripDetailsComponent, {
      panelClass: 'custom-dialog-container',
      data: { trip: trip },
      width: '80vw',
      maxWidth: '800px'
    });
  }

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
          
          // Abrir diálogo modal en lugar de navegar
          const dialogRef = this.dialog.open(PaymentConfirmationComponent, {
            width: '500px',
            data: { paymentResponse: response },
            disableClose: true // Evitar cerrar haciendo clic fuera
          });
  
          // Opcional: Acción después de cerrar el diálogo
          dialogRef.afterClosed().subscribe(() => {
            this.router.navigate(['/']); // Redirigir al home
          });
        },
        error: (err) => {
          console.error('Payment error:', err);
          this.paymentError.set(err.error?.message || 'Error al procesar el pago');
        }
      });
  }

  refreshCart(): void {
    this.loadReservations();
  }
}
