import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Flight } from '../models/flight.model';


@Injectable({
  providedIn: 'root'
})
export class TripService {
  private apiUrl = 'https://cosmosviajesbackend.onrender.com/api';

  constructor(private http: HttpClient) {}

  createTrip(tripData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/trips`, tripData);
  }

  getFlights(): Observable<Flight[]> {
    return this.http.get<Flight[]>(`${this.apiUrl}/flights`);
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

  deleteTrip(tripId: number): Observable<any> {
    console.log(`Viaje ${tripId} eliminado.`);
    return this.http.delete<any[]>(`${this.apiUrl}/trips/${tripId}`);
  }

  getProviderFlights(providerId: number) {
    return this.http.get<any[]>(`${this.apiUrl}/providers/${providerId}/flights`);
  }
}