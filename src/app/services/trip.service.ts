import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';
import { Flight } from '../models/flight.model';

@Injectable({
  providedIn: 'root'
})
export class TripService {
  private apiUrl = 'https://cosmosviajesbackend.onrender.com/api';

  constructor(private http: HttpClient) {}

  private flightsUpdated = new Subject<void>();

  notifyFlightsUpdated(): void {
    this.flightsUpdated.next();
  }

  // Crear viaje con notificación de actualización
  createTrip(tripData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/trips`, tripData).pipe(
      tap({
        next: () => this.flightsUpdated.next(),
        error: (err) => console.error('Error creando viaje:', err)
      })
    );
  }

  // Eliminar viaje con notificación de actualización
  deleteTrip(tripId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/trips/${tripId}`).pipe(
      tap({
        next: () => this.flightsUpdated.next(),
        error: (err) => console.error('Error eliminando viaje:', err)
      })
    );
  }

  getFlights(): Observable<Flight[]> {
    return this.http.get<Flight[]>(`${this.apiUrl}/flights`).pipe(
      tap({
        next: () => this.flightsUpdated.next(),
        error: (err) => console.error('Error obteniendo vuelos:', err)
      })
    );
  }

  getFlightsUpdates(): Observable<void> {
    return this.flightsUpdated.asObservable();
  }

  reserveTrip(data: { user_id: number; trip_id: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/reserved-trips`, data);
  }

  getReservedSeats(tripId: number): Observable<{ reserved_seats: number }> {
    return this.http.get<{ reserved_seats: number }>(`${this.apiUrl}/trips/${tripId}/seats`);
  }
  
  addReservation(reservationData: { 
    user_id: number; 
    trip_id: number;
    quantity: number;
  }): Observable<{ 
    message: string;
    remaining_seats: number;
  }> {
    return this.http.post<{ message: string, remaining_seats: number }>(
      `${this.apiUrl}/reserved-trips`, 
      reservationData
    );
  }

  updateTrip(tripId: number, updatedFields: any) {
    return this.http.post(`${this.apiUrl}/trips/${tripId}/update`, updatedFields);
  }

  purchaseTrip(tripId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/trips/${tripId}/purchase`, {});
  }

  getProviderFlights(providerId: number) {
    return this.http.get<any[]>(`${this.apiUrl}/providers/${providerId}/flights`).pipe(
    tap(() => this.notifyFlightsUpdated())
  );
  }
}