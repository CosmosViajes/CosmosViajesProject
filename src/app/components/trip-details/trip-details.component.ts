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
  trip!: any; // Aquí guardamos los datos del viaje que se está viendo
  hasReservation = false; // Si el usuario ya tiene alguna reserva en este viaje
  reservationsCount: number = 0; // Cuántas reservas tiene el usuario en este viaje
  remainingSeats: number = 0; // Cuántos asientos quedan libres

  constructor(
    public dialogRef: MatDialogRef<TripDetailsComponent>, // Para cerrar la ventana de detalles
    @Inject(MAT_DIALOG_DATA) public data: any, // Recibe los datos del viaje
    private authService: AuthService, // Para saber quién es el usuario y sus reservas
    private tripService: TripService // Para pedir información y hacer reservas
  ) {
    this.trip = data?.trip; // Guardamos el viaje que recibimos
  }

  // Cuando se abre la ventana, comprobamos asientos y reservas del usuario
  ngOnInit(): void {
    this.checkSeatAvailability();
    this.checkUserReservation();
  }

  // Mira cuántos asientos quedan libres en el viaje
  private checkSeatAvailability(): void {
    this.tripService.getReservedSeats(this.trip.id).subscribe({
      next: (response) => {
        this.remainingSeats = this.trip.capacity - response.reserved_seats;
      },
      error: (err) => console.error('Error al verificar asientos:', err)
    });
  }

  // Mira cuántas reservas tiene el usuario en este viaje
  private checkUserReservation(): void {
    const userId = this.authService.authStatus$.getValue()?.userData?.id;
    if (!userId) return;

    this.tripService.getReservedSeats(this.trip.id).subscribe({
      next: (seatsResponse) => {
        this.remainingSeats = this.trip.capacity - seatsResponse.reserved_seats;

        this.authService.getReservedTrips(userId).subscribe({
          next: (reservations) => {
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

  // Cuando el usuario quiere reservar asientos
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

        // Mostramos una ventana para que el usuario elija cuántos asientos quiere reservar
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

            // Antes de reservar, volvemos a comprobar que quedan asientos
            this.tripService.getReservedSeats(this.trip.id).subscribe({
              next: (latestResponse) => {
                const latestAvailable = this.trip.capacity - latestResponse.reserved_seats;

                if (quantity > latestAvailable) {
                  Swal.fire('Error', 'Los asientos ya no están disponibles', 'error');
                  return;
                }

                // Reservamos los asientos uno a uno
                for (let i = 0; i < quantity; i++) {
                  this.tripService.addReservation({
                    user_id: userId,
                    trip_id: this.trip.id,
                    quantity: 1
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

  // Muestra un mensaje de éxito cuando la reserva sale bien
  private showSuccessAlert(quantity: number): void {
    this.tripService.getReservedSeats(this.trip.id).subscribe({
      next: (response) => {
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

  // Cuando el usuario quiere cancelar reservas
  cancelReservation(event?: Event): void {
    if(event) event.stopPropagation();

    const userId = this.authService.authStatus$.getValue()?.userData?.id;
    if (!userId || this.reservationsCount <= 0) {
      this.authService.showErrorAlert("'Error', 'No hay reservas para cancelar'");
      return;
    }

    // Mostramos una ventana para que el usuario elija cuántas reservas quiere cancelar
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

  // Si hay error al reservar, mostramos un mensaje claro
  private handleReservationError(error: any): void {
    if (error.status === 422) {
      Swal.fire('Error', error.error.message, 'error');
    } else {
      Swal.fire('Error', 'Error inesperado al reservar', 'error');
    }
  }

  // Cierra la ventana de detalles del viaje
  closeDialog(): void {
    this.dialogRef.close();
  }

  // Devuelve una clase de CSS según el tipo de viaje (por ejemplo, orbital, lunar...)
  getTypeClass(type: string): string {
    const typeMap: {[key: string]: string} = {
      'Orbital': 'type-orbital',
      'Suborbital': 'type-suborbital',
      'Lunar': 'type-lunar',
      'Espacial': 'type-espacial'
    };
    return typeMap[type] || 'type-orbital';
  }

  // Calcula el precio final, con descuento si el usuario es empresa
  get finalPrice(): number {
    return this.authService.isCompany() 
      ? this.data.trip.price * 0.85 
      : this.data.trip.price;
  }

  // Devuelve el precio original del viaje
  get originalPrice(): number {
    return this.data.trip.price;
  }

  // Devuelve true si el usuario es empresa
  isBusinessAccount(): boolean {
    return this.authService.isCompany();
  }
}