import { Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CartService {
  private reservationsSource = new BehaviorSubject<any[]>([]);
  currentReservations = this.reservationsSource.asObservable();
  private cartVersion = signal<number>(0);

  updateReservations(reservations: any[]) {
    this.reservationsSource.next(reservations);
  }

  getTotalPrice(reservations: any[]): number {
    return reservations.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }

  notifyChanges() {
    this.cartVersion.update(v => v + 1);
  }

  getCartVersion() {
    return this.cartVersion.asReadonly();
  }
}