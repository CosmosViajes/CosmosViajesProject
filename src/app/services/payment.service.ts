import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PaymentApiResponse } from '../models/payment.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = `http://cosmoviajes.local/api/payments`;

  constructor(private http: HttpClient) { }

  processPayment(paymentData: any): Observable<PaymentApiResponse> {
    return this.http.post<PaymentApiResponse>(`${this.apiUrl}/process`, paymentData);
  }

  getPendingPayments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pending`);
  }

  acceptPayment(paymentId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${paymentId}/accept`, {});
  }

  rejectPayment(paymentId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${paymentId}/reject`, {});
  }

  getUserPayments(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users/${userId}/payments`);
  }  
  
  getReservationHistory(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users/${userId}/reservation-history`);
  }

}
