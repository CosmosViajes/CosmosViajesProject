import { Component, Input, inject } from '@angular/core';
import { TripService } from '../../services/trip.service';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { TripDetailsComponent } from '../trip-details/trip-details.component';
import { AuthService } from '../../services/auth.service'; // Asegúrate de tener este servicio

@Component({
  selector: 'app-flight-list-modal',
  templateUrl: './flight-list-modal.component.html',
  imports: [
    CommonModule
  ]
})
export class FlightListModalComponent {
  @Input() providerId!: number;
  flights: any[] = [];
  loading = true;
  showModal = false;
  isCompanyUser: boolean = false;
  private dialog = inject(MatDialog);

  constructor(
    private tripService: TripService,
    private authService: AuthService // Servicio que verifica el tipo de usuario
  ) {}

  ngOnChanges() {
    if (this.providerId) {
      this.checkUserType();
      this.loadFlights();
    }
  }

  checkUserType() {
    // Implementación depende de tu AuthService
    this.isCompanyUser = this.authService.isCompany();
  }

  loadFlights() {
    this.tripService.getProviderFlights(this.providerId).subscribe({
      next: (data) => {
        this.flights = data.map(flight => ({
          ...flight,
          discountedPrice: this.isCompanyUser ? this.calculateDiscount(flight.price) : flight.price
        }));
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  calculateDiscount(price: number): number {
    const discountRate = 0.15; // 15% de descuento
    return price * (1 - discountRate);
  }

  toggleModal() {
    this.showModal = !this.showModal;
    if (this.showModal) {
      this.checkUserType();
      this.loadFlights();
    }
  }

  viewTripDetails(trip: any): void {
    this.dialog.open(TripDetailsComponent, {
      panelClass: 'custom-dialog-container',
      backdropClass: 'custom-backdrop',
      autoFocus: false,
      data: { trip: trip },
      position: {
        top: '0',
        left: '0'
      },
      maxWidth: 'none'
    });
  }
}