import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { TripService } from '../../services/trip.service';
import { AuthService } from '../../services/auth.service';
import { Subscription, interval, switchMap, takeUntil, Subject, of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { EditTripDialogComponent } from '../edit-trip-dialog/edit-trip-dialog.component';
import { LoginDialogComponent } from '../login-dialog/login-dialog.component';
import { RegisterDialogComponent } from '../register-dialog/register-dialog.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-flight-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
  ],
  template: `
    <div class="flight-card bg-white bg-opacity-10 rounded-lg shadow-lg p-2 flex flex-col gap-4 relative transition-transform transform hover:shadow-xl">
      <!-- Encabezado del vuelo -->
      <div class="flex items-center">
        <!-- Nombre del vuelo -->
        <div class="w-[45%] flex items-center">
          <h3 class="text-xl font-bold text-white">{{ flight?.name }}</h3>
        </div>

        <!-- Tipo de vuelo -->
        <div class="w-[10%] flex justify-center">
          <span
            class="text-xs font-medium px-3 py-1 rounded-full text-white"
            [ngClass]="{
              'bg-blue-500': flight?.type === 'Orbital',
              'bg-green-500': flight?.type === 'Suborbital',
              'bg-red-500': flight?.type === 'Lunar',
              'bg-pink-500': flight?.type === 'Espacial'
            }"
          >
            {{ flight?.type | uppercase }}
          </span>
        </div>

        <!-- Precio del vuelo -->
        <div class="w-[45%] flex justify-end">
          <span *ngIf="isBusinessAccount()" class="discounted-price">
            <span class="original">{{ originalPrice | currency:'EUR':'symbol':'1.2-2' }}</span>
            {{ finalPrice | currency:'EUR':'symbol':'1.2-2' }}
            <span class="discount-badge">-15%</span>
          </span>

          <span *ngIf="!isBusinessAccount()" class="normal-price">
            {{ finalPrice | currency:'EUR':'symbol':'1.2-2' }}
          </span>
        </div>
      </div>

      <!-- Flecha para desplegar información y botón de reserva -->
      <div class="flex items-center mt-2">
        <!-- Botones para propietario -->
        <div class="flex items-center justify-start w-[40%]">
          <!-- Botón principal -->
          <button 
            *ngIf="isCompanyOwner"
            (click)="showTripOptions($event)"
            class="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 shadow-md flex items-center"
          >
            <mat-icon class="mr-2">settings</mat-icon>
            Administrar
          </button>
        </div>
        <div class="flex items-center justify-center w-[20%]">
          <button
            (click)="toggleDetails()"
            class="flex items-center justify-center w-[32px] h-[32px] text-white hover:text-black transition-colors duration-300"
          >
            <mat-icon>{{ showDetails ? 'expand_less' : 'expand_more' }}</mat-icon>
          </button>
        </div>
        <div class="flex items-center justify-end w-[40%]">
          <button
            *ngIf="!isCompanyOwner && !hasReservation"
            (click)="reserveFlight($event)"
            class="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-300"
          >
            Reservar
          </button>
          <button
            *ngIf="!isCompanyOwner && hasReservation"
            (click)="showReservationDetails($event)"
            class="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors duration-300"
          >
            Reservado
          </button>
        </div>
      </div>

      <!-- Información adicional desplegable -->
      <div *ngIf="showDetails" class="details bg-white bg-opacity-10 border border-white p-3 rounded-lg shadow-md mt-4">
        <!-- Información dividida en tres columnas -->
        <div class="flex justify-around items-center mb-6">
          <!-- Fecha de salida -->
          <div class="flex flex-col items-center w-1/3">
            <p class="text-sm font-medium text-white"><mat-icon class="text-blue-500">flight_takeoff</mat-icon></p>
            <p class="text-sm font-medium text-white">Salida</p>
            <p class="text-sm text-gray-300">{{ flight?.departure | date: 'dd-MM-yyyy' }}</p>
          </div>

          <!-- Duración -->
          <div class="flex flex-col items-center w-1/3">
            <p class="text-sm font-medium text-white"><mat-icon class="text-blue-500">flight_land</mat-icon></p>
            <p class="text-sm font-medium text-white">Duración</p>
            <p class="text-sm text-gray-300">{{ flight?.duration | date: 'dd-MM-yyyy' }}</p>
          </div>

          <!-- Número de pasajeros -->
          <div class="flex flex-col items-center w-1/3">
            <p class="text-sm font-large text-white"><mat-icon class="text-blue-500">group</mat-icon></p>
            <p class="text-sm font-medium text-white">Pasajeros</p>
            <p class="text-sm text-gray-300">{{ flight?.capacity }} pasajeros</p>
          </div>
        </div>
        <!-- Descripción del viaje -->
        <div class="bg-white bg-opacity-10 border border-blue p-2 rounded-md">
          <h4 class="text-lg font-semibold text-blue mb-2">Descripción</h4>
          <p class="text-gray-300">{{ flight?.description }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Estilos para precios con descuento */
.discounted-price {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #2e7d32; /* Verde para precios con descuento */
}

.original {
  text-decoration: line-through;
  color: #999;
  font-size: 0.9em;
}

.discount-badge {
  background-color: #ff5252;
  color: white;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 0.8em;
}

.normal-price {
  color: #1976d2; /* Azul para precios normales */
}

/* Mejora el contenedor de precio */
.price-section {
  margin: 10px 0;
  font-weight: 500;
  font-size: 1.1em;
}
    `],
})
export class FlightCardComponent implements OnInit, OnDestroy {
  // Recibe información de un viaje espacial (flight) y avisa si se borra un viaje
  @Input() flight!: any;
  @Output() tripDeleted = new EventEmitter<number>();

  // Aquí guardamos datos de usuario y otras cosas para saber si está logueado, si tiene reservas, etc.
  authStatus: any = null;
  private authSubscription!: Subscription;
  private reservedTripsSubscription!: Subscription;
  private destroy$ = new Subject<void>();

  // Usamos servicios para saber si el usuario está logueado, para gestionar viajes y para mostrar ventanas emergentes
  private authService = inject(AuthService);
  private tripService = inject(TripService);
  private dialog = inject(MatDialog);

  hasReservation = false; // ¿El usuario tiene reservas en este viaje?
  isCompanyOwner = false; // ¿El usuario es el dueño de la empresa que ofrece el viaje?
  numberOfReservations: number = 0; // Cuántas reservas tiene el usuario en este viaje
  reservationsCount: number = 0; // Total de reservas del usuario en este viaje
  remainingSeats: number = 0; // Cuántos asientos quedan libres en el viaje

  // Muestra un menú con opciones para editar o borrar el viaje
  showTripOptions(event: Event): void {
    event.stopPropagation();
  
    const iconStyle = `style="font-family: 'Material Icons'; font-size: 24px; vertical-align: middle;"`;
  
    // Aquí sale una ventanita con los botones de editar y borrar
    Swal.fire({
      title: `Opciones para: <span class="text-indigo-600">${this.flight.name}</span>`,
      html: `
        <div class="grid grid-cols-2 gap-4 w-full mt-4">
          <div class="col-span-1">
            <button 
              id="edit-btn"
              class="w-full px-4 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-all duration-300 flex flex-col items-center justify-center"
            >
              <span ${iconStyle}>&#xE254;</span>
              <span class="mt-2">Editar Viaje</span>
            </button>
          </div>
          <div class="col-span-1">
            <button 
              id="delete-btn"
              class="w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-300 flex flex-col items-center justify-center"
            >
              <span ${iconStyle}>&#xE872;</span>
              <span class="mt-2">Eliminar Viaje</span>
            </button>
          </div>
        </div>
      `,
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: 'Cerrar',
      cancelButtonColor: '#6b7280',
      background: '#f8fafc',
      width: '500px',
      backdrop: 'rgba(0,0,0,0.6)', // Color de fondo semitransparente
      customClass: {
        htmlContainer: '!text-center',
        popup: '!rounded-xl !pb-6',
        title: '!text-lg !mb-4 !font-semibold'
      },
      didOpen: () => {
        setTimeout(() => {
          document.getElementById('edit-btn')?.addEventListener('click', () => {
            Swal.close();
            this.openEditTripDialog(event);
          });
  
          document.getElementById('delete-btn')?.addEventListener('click', () => {
            Swal.close();
            this.deleteTrip(event);
          });
        }, 50);
      }
    });
  }  
// Cuando se monta el componente, nos suscribimos a los cambios de usuario y reservas
  ngOnInit(): void {
    this.subscribeToAuthChanges();
    this.initializeReservationCheck();
    this.pollReservedTrips();
  }

  // Cuando se destruye el componente, limpiamos todo para que no haya problemas de memoria
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.reservedTripsSubscription) {
      this.reservedTripsSubscription.unsubscribe();
    }
  }

  // Nos suscribimos para saber si el usuario inicia/cierra sesión y actualizamos datos
  private subscribeToAuthChanges(): void {
    this.authSubscription = this.authService.authStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe((authStatus) => {
        this.authStatus = authStatus;
        this.checkCompanyOwnership();
        this.checkReservation();
      });
  }

  // Comprobamos si el usuario es el dueño de la empresa que ofrece el viaje
  private checkCompanyOwnership(): void {
    this.isCompanyOwner = this.authStatus?.isAuthenticated &&
      this.authStatus?.userData?.id === this.flight?.company_id;
  }

  // Al principio, miramos si el usuario tiene reservas en este viaje
  private initializeReservationCheck(): void {
    if (this.authStatus?.userData?.id) {
      this.authService.getReservedTrips(this.authStatus.userData.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe(reservedTrips => {
          this.checkReservation(reservedTrips);
        });
    }
  }

  // Cada 5 segundos, volvemos a comprobar las reservas para que todo esté actualizado
  private pollReservedTrips(): void {
    this.reservedTripsSubscription = interval(5000)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => {
          if (this.authStatus?.userData?.id) {
            return this.authService.getReservedTrips(this.authStatus.userData.id);
          } else {
            return of([]);
          }
        })
      )
      .subscribe(reservedTrips => {
        this.checkReservation(reservedTrips);
      });
  }

  // Comprobamos si el usuario tiene reservas en este viaje y cuántas
  private checkReservation(reservedTrips: any[] = []): void {
    if (this.flight && reservedTrips) {
      const flightReservations = reservedTrips.filter(trip => trip.trip_id === this.flight.id);
      this.hasReservation = flightReservations.length > 0;
      this.numberOfReservations = flightReservations.length;
    } else {
      this.hasReservation = false;
      this.numberOfReservations = 0;
    }
  }

  // Cuando el usuario quiere reservar asientos
  reserveFlight(event: Event): void {
    event.stopPropagation();

    // 1. Verificación inicial de autenticación
    if (!this.authStatus?.isAuthenticated) {
      Swal.fire({
        icon: 'info',
        title: '¡Debes iniciar sesión o registrarte!',
        html: `
          <div style="font-size:1.15em;">
            <p>Para reservar un viaje necesitas tener una cuenta.</p>
            <p>
              <b>Inicia sesión</b> si ya tienes cuenta,<br>
              o <b>regístrate</b> si eres nuevo usuario.
            </p>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Iniciar sesión',
        cancelButtonText: 'Registrarme',
        confirmButtonColor: '#1976d2',
        cancelButtonColor: '#43a047',
        background: '#f8fafc',
        backdrop: 'rgba(0,0,0,0.6)',
        customClass: {
          popup: 'rounded-xl shadow-lg',
          title: 'text-xl font-semibold text-blue-700',
          htmlContainer: 'text-center'
        }
      }).then((result) => {
        if (result.isConfirmed) {
          this.openLoginDialog();
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          this.openRegisterDialog();
        }
      });
      return;
    }

    // Si está logueado, comprobamos cuántos asientos quedan y dejamos reservar
    const userId = this.authStatus.userData.id;
    const tripId = this.flight.id;

    this.tripService.getReservedSeats(tripId).subscribe({
      next: (response) => {
        const availableSeats = this.flight.capacity - response.reserved_seats;

        // Mostramos una ventana para que elija cuántos asientos reservar
        if (availableSeats <= 0) {
          Swal.fire('No disponible', 'No hay asientos disponibles', 'info');
          return;
        }

        Swal.fire({
          title: 'Reservar asientos',
          html: `
            <p>Disponibles: <strong>${availableSeats}</strong></p>
            <p>Tus reservas: <strong>${this.reservationsCount}</strong></p>
            <input type="number" id="reservationCount" class="swal2-input"
                   min="1" max="${availableSeats}" 
                   value="1" autofocus>
          `,
          showCancelButton: true,
          confirmButtonText: 'Reservar',
          cancelButtonText: 'Cancelar',
          preConfirm: () => {
            const input = document.getElementById('reservationCount') as HTMLInputElement;
            const value = Number(input.value);

            if (value < 1 || value > availableSeats) {
              Swal.showValidationMessage(`Debes reservar entre 1 y ${availableSeats} asientos`);
              return false;
            }
            return value;
          }
        }).then((result) => {
          if (result.isConfirmed) {
            const quantity = result.value;

            // Volvemos a comprobar que aún quedan asientos y reservamos
            this.tripService.getReservedSeats(tripId).subscribe({
              next: (latestResponse) => {
                const latestAvailable = this.flight.capacity - latestResponse.reserved_seats;

                if (quantity > latestAvailable) {
                  Swal.fire('Error', 'Los asientos ya no están disponibles', 'error');
                  return;
                }

                // 5. Proceso de reserva optimizado
                this.processReservations(userId, tripId, quantity);
              },
              error: (err) => this.handleReservationError(err)
            });
          }
        });
      },
      error: (err) => this.handleReservationError(err)
    });
  }
// Abre la ventana de login
  openLoginDialog() {
    this.dialog.open(LoginDialogComponent, {
      width: '60vw',
      height: 'auto',
      panelClass: 'custom-dialog-container',
      backdropClass: 'custom-backdrop'
    });
  }

  // Abre la ventana de registro
  openRegisterDialog() {
    this.dialog.open(RegisterDialogComponent, {
      width: '60vw',
      height: 'auto',
      panelClass: 'custom-dialog-container',
      backdropClass: 'custom-backdrop'
    });
  }

  // Hace la reserva de los asientos uno a uno
  private processReservations(userId: number, tripId: number, quantity: number): void {
    let successCount = 0;
    const reservationObservables = [];
    for (let i = 0; i < quantity; i++) {
      reservationObservables.push(
        this.tripService.addReservation({
          user_id: userId,
          trip_id: tripId,
          quantity: 1
        })
      );
    }

    reservationObservables.forEach((obs, index) => {
      obs.subscribe({
        next: (res) => {
          successCount++;
          if (successCount === quantity) {
            this.handleReservationSuccess(res, quantity);
          }
        },
        error: (err) => {
          Swal.fire('Error', `Error al reservar asiento ${index + 1}: ${err.message}`, 'error');
        }
      });
    });
  }

  // Cuando la reserva sale bien, actualizamos los datos y mostramos un mensaje de éxito
  private handleReservationSuccess(response: any, quantity: number): void {
    this.remainingSeats = response.remaining_seats;
    this.reservationsCount += quantity;
    this.checkSeatAvailability();
    this.checkUserReservation();
    this.showSuccessAlert(quantity);
  }

  // Muestra una ventana diciendo que la reserva fue un éxito
  private showSuccessAlert(quantity: number): void {
    this.tripService.getReservedSeats(this.flight.id).subscribe({
      next: (response) => {
        this.remainingSeats = this.flight.capacity - response.reserved_seats;

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

  // Si hay error al reservar, mostramos un mensaje
  private handleReservationError(error: any): void {
    if (error.status === 422) {
      Swal.fire('Error', error.error.message, 'error');
    } else {
      Swal.fire('Error', 'Error inesperado al reservar', 'error');
    }
  }

  // Mostrar u ocultar detalles del viaje
  showDetails = false;
  toggleDetails(): void {
    this.showDetails = !this.showDetails;
  }

  // Borra el viaje si el usuario es el dueño
  deleteTrip(event: Event): void {
    event.stopPropagation();

    if (!this.authStatus || !this.authStatus.isAuthenticated || this.authStatus.userData.id !== this.flight.company_id) {
      this.authService.showErrorAlert('No tienes permiso para eliminar este viaje.');
      return;
    }

    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar el viaje "${this.flight.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'No, cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.tripService.deleteTrip(this.flight.id).subscribe({
          next: () => {
            Swal.fire('Eliminado', `El viaje "${this.flight.name}" ha sido eliminado.`, 'success');
            this.tripDeleted.emit(this.flight.id);
          },
          error: (err) => {
            Swal.fire('Error', 'Hubo un problema al intentar eliminar el viaje.', 'error');
          },
        });
      }
    });
  }

  // Cancela reservas del usuario en este viaje
  cancelReservation(event: Event): void {
    event.stopPropagation();

    if (!this.authStatus || !this.authStatus.isAuthenticated) {
      this.authService.showErrorAlert('Debes iniciar sesión para cancelar esta reserva.');
      return;
    }

    const userId = this.authStatus.userData.id;

    // Busca las reservas del usuario para este viaje
    this.authService.getReservedTrips(userId).subscribe(reservedTrips => {
      const userReservationsForFlight = reservedTrips
        .filter(trip => trip.trip_id === this.flight.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      const actualReservationsCount = userReservationsForFlight.length;

      Swal.fire({
        title: 'Cancelar Reservas',
        html: `
          <p>Reservas totales: <strong>${actualReservationsCount}</strong></p>
          <p>¿Cuántas deseas cancelar?</p>
          <input type="number" id="cancelCount" class="swal2-input"
                 min="1" max="${actualReservationsCount}" 
                 value="1">
        `,
        showCancelButton: true,
        confirmButtonText: 'Confirmar Cancelación',
        cancelButtonText: 'Mantener Reservas',
        preConfirm: () => {
          const count = Number((document.getElementById('cancelCount') as HTMLInputElement).value);
          if (count < 1 || count > actualReservationsCount) {
            Swal.showValidationMessage(`Debes cancelar entre 1 y ${actualReservationsCount} reservas`);
          }
          return count;
        }
      }).then((result) => {
        if (result.isConfirmed) {
          const cancelQuantity = result.value;
          let cancelledCount = 0;
          const reservationsToCancel = userReservationsForFlight.slice(0, cancelQuantity);

          reservationsToCancel.forEach(reservation => {
            this.authService.cancelReservation(userId, reservation.id).subscribe({
              next: () => {
                cancelledCount++;
                if (cancelledCount === reservationsToCancel.length) {
                  this.authService.showSuccessAlert(
                    'Cancelación Exitosa',
                    `Se cancelaron ${cancelQuantity} reserva${cancelQuantity > 1 ? 's' : ''}`
                  );
                  this.checkReservation();
                  this.checkUserReservation();
                  this.checkSeatAvailability();
                }
              },
              error: (err) => {
                this.authService.showErrorAlert(
                  "`Error en reserva ${reservation.id}`, `No se pudo cancelar: ${err.message}`"
                );
              }
            });
          });
        }
      });
    });
  }

  // Comprueba cuántos asientos quedan libres en el viaje
  private checkSeatAvailability(): void {
    this.tripService.getReservedSeats(this.flight.id).subscribe({
      next: (response) => {
        this.remainingSeats = this.flight.capacity - response.reserved_seats;
      },
      error: (err) => console.error('Error al verificar asientos:', err)
    });
  }

  // Comprueba cuántas reservas tiene el usuario en este viaje
  private checkUserReservation(): void {
    const userId = this.authStatus?.userData?.id;

    if (!userId) return;

    this.tripService.getReservedSeats(this.flight.id).subscribe({
      next: (seatsResponse) => {
        this.remainingSeats = this.flight.capacity - seatsResponse.reserved_seats;

        this.authService.getReservedTrips(userId).subscribe({
          next: (reservations) => {
            this.reservationsCount = reservations
              .filter((res: any) => res.trip_id === this.flight.id)
              .reduce((sum: number, res: any) => sum + res.quantity, 0);

            this.hasReservation = this.reservationsCount > 0;
          },
          error: (err) => console.error('Error al verificar reservas:', err)
        });
      },
      error: (err) => console.error('Error al verificar asientos:', err)
    });
  }

  // Muestra una ventana con detalles de la reserva y opciones para añadir o cancelar asientos
  showReservationDetails(event: Event): void {
    event.stopPropagation();

    // Verificación en tiempo real antes de mostrar
    this.tripService.getReservedSeats(this.flight.id).subscribe({
      next: (response) => {
        const availableSeats = this.flight.capacity - response.reserved_seats;
        this.remainingSeats = availableSeats;

        this.authService.getReservedTrips(this.authStatus?.userData?.id).subscribe({
          next: (reservations) => {
            const updatedCount = reservations.filter(trip => trip.trip_id === this.flight.id).length;
            this.numberOfReservations = updatedCount;

            Swal.fire({
              title: 'Detalles de la Reserva',
              html: `
                            <p>Número de reservas: <strong>${updatedCount}</strong></p>
                            <p>Asientos disponibles: <strong>${availableSeats}</strong></p>
                            <div style="margin-top: 1em;">
                                <button id="addMore" class="swal2-styled swal2-confirm" 
                                        style="background-color: #3085d6;"
                                        ${availableSeats <= 0 ? 'disabled' : ''}>
                                    Añadir Más Reservas
                                </button>
                                <button id="cancelSome" class="swal2-styled swal2-cancel" 
                                        style="background-color: #d33; margin-left: 0.5em;"
                                        ${updatedCount === 0 ? 'disabled' : ''}>
                                    Cancelar Reservas
                                </button>
                            </div>
                        `,
              showCancelButton: false,
              showConfirmButton: false,
              didOpen: () => {
                const addMoreButton = document.getElementById('addMore');
                const cancelSomeButton = document.getElementById('cancelSome');

                if (addMoreButton) {
                  addMoreButton.onclick = () => {
                    Swal.close();
                    if (availableSeats > 0) {
                      this.reserveFlight(event);
                    } else {
                      Swal.fire('No disponible', 'No hay asientos disponibles', 'info');
                    }
                  };
                }

                if (cancelSomeButton) {
                  cancelSomeButton.onclick = () => {
                    Swal.close();
                    if (updatedCount > 0) {
                      this.cancelReservation(event);
                    }
                  };
                }
              }
            });
          },
          error: (err) => {
            Swal.fire('Error', 'No se pudieron cargar tus reservas', 'error');
          }
        });
      },
      error: (err) => {
        Swal.fire('Error', 'No se pudo verificar la disponibilidad', 'error');
      }
    });
  }

  // Calcula el precio final (con descuento si es empresa)
  get finalPrice(): number {
    return this.authService.isCompany()
      ? this.flight.price * 0.85
      : this.flight.price;
  }

  // Devuelve el precio original del viaje
  get originalPrice(): number {
    return this.flight.price;
  }

  // ¿El usuario es una empresa?
  isBusinessAccount(): boolean {
    return this.authService.isCompany();
  }

  // Abre la ventana para editar el viaje
  openEditTripDialog(event: Event): void {
    event.stopPropagation();
    const dialogRef = this.dialog.open(EditTripDialogComponent, {
      width: '600px',
      panelClass: 'custom-dialog-container',
      backdropClass: 'custom-backdrop',
      data: { trip: this.flight }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'updated') {
        // Aquí podrías refrescar la lista de viajes o hacer otra acción
        this.tripService.deleteTrip(this.flight.id); // O mejor, refresca la lista desde el padre
      }
    });
  }
}