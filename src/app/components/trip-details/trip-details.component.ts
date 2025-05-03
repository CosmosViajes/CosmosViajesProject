import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';
import { TripService } from '../../services/trip.service';

@Component({
  selector: 'app-trip-details',
  standalone: true,
  templateUrl: './trip-details.component.html',
  styleUrls: ['./trip-details.component.css'],
  imports: [CommonModule, MatButtonModule, MatIconModule]
})
export class TripDetailsComponent implements OnInit {
  trip!: any;
  hasReservation = false;
  reservationsCount: number = 0;
  remainingSeats: number = 0;

  constructor(
    public dialogRef: MatDialogRef<TripDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private authService: AuthService,
    private tripService: TripService
  ) {
    this.trip = data?.trip;
  }

  ngOnInit(): void {
    this.checkSeatAvailability();
    this.checkUserReservation();
  }

  private checkSeatAvailability(): void {
    this.tripService.getReservedSeats(this.trip.id).subscribe({
      next: (response) => {
        this.remainingSeats = this.trip.capacity - response.reserved_seats;
      },
      error: (err) => console.error('Error al verificar asientos:', err)
    });
  }

  private checkUserReservation(): void {
    const userId = this.authService.authStatus$.getValue()?.userData?.id;
    
    if (!userId) return;
  
    // Primero verifica los asientos totales del vuelo
    this.tripService.getReservedSeats(this.trip.id).subscribe({
      next: (seatsResponse) => {
        this.remainingSeats = this.trip.capacity - seatsResponse.reserved_seats;
  
        // Luego obtiene las reservas del usuario
        this.authService.getReservedTrips(userId).subscribe({
          next: (reservations) => {
            // Suma las cantidades de todas las reservas del usuario
            this.reservationsCount = reservations
              .filter((res: any) => res.trip_id === this.trip.id)
              .reduce((sum: number, res: any) => sum + res.quantity, 0);
              
            this.hasReservation = this.reservationsCount > 0;
          },
          error: (err) => console.error('Error al verificar reservas:', err)
        });
      },
      error: (err) => console.error('Error al verificar asientos:', err)
    });
  }

  addReservation(event?: Event): void {
    if (event) event.stopPropagation();

    if (this.remainingSeats <= 0) {
      Swal.fire('No disponible', 'No se pueden hacer más reservas para este viaje', 'info');
      return;
    }
  
    const userId = this.authService.authStatus$.getValue()?.userData?.id;
    
    if (!userId || !this.trip?.id) {
      this.authService.showErrorAlert("'Error', 'Debes iniciar sesión para reservar'");
      return;
    }
  
    this.tripService.getReservedSeats(this.trip.id).subscribe({
      next: (response) => {
        const availableSeats = this.trip.capacity - response.reserved_seats;
  
        Swal.fire({
          title: 'Reservar asientos',
          html: `
            <p>Disponibles: <strong>${availableSeats}</strong></p>
            <p>Tus reservas: <strong>${this.reservationsCount}</strong></p>
            <input type="number" id="reservationCount" class="swal2-input"
                   min="1" max="${availableSeats}" 
                   value="1">
          `,
          showCancelButton: true,
          confirmButtonText: 'Reservar',
          cancelButtonText: 'Cancelar',
          preConfirm: () => {
            const value = Number((document.getElementById('reservationCount') as HTMLInputElement).value);
            if (value < 1 || value > availableSeats) {
              Swal.showValidationMessage(`Debes reservar entre 1 y ${availableSeats} asientos`);
            }
            return value;
          }
        }).then((result) => {
          if (result.isConfirmed) {
            const quantity = result.value;
            let successCount = 0;
  
            // Verificar disponibilidad real antes de reservar
            this.tripService.getReservedSeats(this.trip.id).subscribe({
              next: (latestResponse) => {
                const latestAvailable = this.trip.capacity - latestResponse.reserved_seats;
  
                if (quantity > latestAvailable) {
                  Swal.fire('Error', 'Los asientos ya no están disponibles', 'error');
                  return;
                }
  
                // Reservar cada asiento individualmente
                for (let i = 0; i < quantity; i++) {
                  this.tripService.addReservation({
                    user_id: userId,
                    trip_id: this.trip.id,
                    quantity: 1 // Reserva de 1 asiento por iteración
                  }).subscribe({
                    next: (res) => {
                      successCount++;
                      if (successCount === quantity) {
                        this.remainingSeats = res.remaining_seats;
                        this.reservationsCount += quantity;
                        this.showSuccessAlert(quantity);
                        this.checkSeatAvailability();
                        this.checkUserReservation();
                      }
                    },
                    error: (err) => {
                      Swal.fire('Error', `Error al reservar asiento ${i + 1}: ${err.message}`, 'error');
                    }
                  });
                }
              },
              error: (err) => this.handleReservationError(err)
            });
          }
        });
      },
      error: (err) => this.handleReservationError(err)
    });
  }
  
  private showSuccessAlert(quantity: number): void {
    // Asegurarse de que los datos están actualizados (usar los valores más recientes)
    this.tripService.getReservedSeats(this.trip.id).subscribe({
        next: (response) => {
            // Actualizar los valores locales con la respuesta más reciente
            this.remainingSeats = this.trip.capacity - response.reserved_seats;
            
            Swal.fire({
                icon: 'success',
                title: `¡${quantity} asiento${quantity > 1 ? 's' : ''} reservado${quantity > 1 ? 's' : ''}!`,
                html: `
                    <p>Reservas totales: <strong>${this.reservationsCount}</strong></p>
                    <p>Asientos disponibles: <strong>${this.remainingSeats}</strong></p>
                `,
                confirmButtonText: 'Aceptar'
            });
        },
        error: (err) => {
            Swal.fire('Error', 'No se pudo verificar la disponibilidad actual', 'error');
        }
    });
  }

  cancelReservation(event?: Event): void {
    if(event) event.stopPropagation();
    
    const userId = this.authService.authStatus$.getValue()?.userData?.id;
    
    if (!userId || this.reservationsCount <= 0) {
      this.authService.showErrorAlert("'Error', 'No hay reservas para cancelar'");
      return;
    }

    Swal.fire({
      title: 'Cancelar Reservas',
      html: `
        <p>¿Cuántas reservas deseas cancelar para este viaje?</p>
        <p>Tus reservas: <strong>${this.reservationsCount}</strong></p>
        <input type="number" id="cancelCount" class="swal2-input"
               min="1" max="${this.reservationsCount}" 
               value="1">
      `,
      showCancelButton: true,
      confirmButtonText: 'Cancelar Reservas',
      cancelButtonText: 'Mantener',
      preConfirm: () => {
        const count = Number((document.getElementById('cancelCount') as HTMLInputElement).value);
        if (count < 1 || count > this.reservationsCount) {
          Swal.showValidationMessage(`Debes cancelar entre 1 y ${this.reservationsCount} reservas`);
        }
        return count;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const cancelQuantity = result.value;
        let cancelledCount = 0;

        this.authService.getReservedTrips(userId).subscribe({
          next: (reservations) => {
            const reservationsToCancel = reservations
              .filter((res: any) => res.trip_id === this.trip.id)
              .slice(0, cancelQuantity);

            if (reservationsToCancel.length < cancelQuantity) {
              Swal.fire('Error', 'No se encontraron suficientes reservas para cancelar', 'error');
              return;
            }

            reservationsToCancel.forEach(reservation => {
              this.authService.cancelReservation(userId, reservation.id).subscribe({
                next: () => {
                  cancelledCount++;
                  if (cancelledCount === cancelQuantity) {
                    this.reservationsCount -= cancelQuantity;
                    this.remainingSeats += cancelQuantity;
                    this.checkSeatAvailability();
                    this.checkUserReservation();
                    Swal.fire(
                      '¡Cancelación exitosa!',
                      `Se cancelaron ${cancelQuantity} reserva(s)`,
                      'success'
                    );
                  }
                },
                error: (err) => {
                  Swal.fire('Error', `Error al cancelar la reserva: ${err.message}`, 'error');
                }
              });
            });
          },
          error: (err) => {
            Swal.fire('Error', 'Error al obtener las reservas', 'error');
          }
        });
      }
    });
  }

  private handleReservationError(error: any): void {
    if (error.status === 422) {
      Swal.fire('Error', error.error.message, 'error');
    } else {
      Swal.fire('Error', 'Error inesperado al reservar', 'error');
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  getTypeClass(type: string): string {
    const typeMap: {[key: string]: string} = {
      'Orbital': 'type-orbital',
      'Suborbital': 'type-suborbital',
      'Lunar': 'type-lunar',
      'Espacial': 'type-espacial'
    };
    return typeMap[type] || 'type-orbital';
  }

  get finalPrice(): number {
    return this.authService.isCompany() 
      ? this.data.trip.price * 0.85 
      : this.data.trip.price;
  }

  get originalPrice(): number {
    return this.data.trip.price;
  }

  isBusinessAccount(): boolean {
    return this.authService.isCompany();
  }
}