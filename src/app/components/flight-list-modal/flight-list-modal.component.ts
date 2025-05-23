import { Component, Input, inject } from '@angular/core';
import { TripService } from '../../services/trip.service';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { TripDetailsComponent } from '../trip-details/trip-details.component';
import { AuthService } from '../../services/auth.service'; // Servicio para saber si el usuario es empresa

@Component({
  selector: 'app-flight-list-modal',
  templateUrl: './flight-list-modal.component.html',
  imports: [
    CommonModule
  ]
})
export class FlightListModalComponent {
  @Input() providerId!: number; // Aquí recibimos el id del proveedor (empresa)
  flights: any[] = []; // Aquí guardamos la lista de viajes de ese proveedor
  loading = true; // Esto es para saber si estamos cargando los datos
  showModal = false; // Esto es para mostrar o esconder la ventana de los viajes
  isCompanyUser: boolean = false; // Esto nos dice si el usuario es una empresa
  private dialog = inject(MatDialog);

  constructor(
    private tripService: TripService, // Servicio para pedir los viajes al servidor
    private authService: AuthService // Servicio para saber si el usuario es empresa
  ) {}

  // Cada vez que cambia el id del proveedor, miramos si el usuario es empresa y cargamos los viajes
  ngOnChanges() {
    if (this.providerId) {
      this.checkUserType();
      this.loadFlights();
    }
  }

  // Aquí comprobamos si el usuario es una empresa
  checkUserType() {
    this.isCompanyUser = this.authService.isCompany();
  }

  // Aquí pedimos los viajes del proveedor al servidor
  loadFlights() {
    this.tripService.getProviderFlights(this.providerId).subscribe({
      next: (data) => {
        // Si el usuario es empresa, aplicamos descuento al precio
        this.flights = data.map(flight => ({
          ...flight,
          discountedPrice: this.isCompanyUser ? this.calculateDiscount(flight.price) : flight.price
        }));
        this.loading = false; // Ya hemos terminado de cargar
      },
      error: () => this.loading = false // Si hay error, dejamos de cargar
    });
  }

  // Calcula el precio con descuento (15% menos)
  calculateDiscount(price: number): number {
    const discountRate = 0.15; // 15% de descuento
    return price * (1 - discountRate);
  }

  // Muestra u oculta la ventana con la lista de viajes
  toggleModal() {
    this.showModal = !this.showModal;
    if (this.showModal) {
      this.checkUserType();
      this.loadFlights();
    }
  }

  // Muestra los detalles de un viaje en una ventana emergente
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