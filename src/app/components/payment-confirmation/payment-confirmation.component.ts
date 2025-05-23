import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PaymentApiResponse } from '../../models/payment.model';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateStatusPipe } from '../../pipes/translate-status.pipe';

@Component({
  selector: 'app-payment-confirmation',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    TranslateStatusPipe
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon [color]="statusColor">{{ statusIcon }}</mat-icon>
      Pago {{ data.paymentResponse.status | translateStatus }}
    </h2>
    
    <mat-dialog-content>
      <div class="payment-details">
        <p><strong>ID:</strong> {{ data.paymentResponse.transaction_id }}</p>
        <p><strong>Monto:</strong> {{ data.paymentResponse.amount | currency:data.paymentResponse.currency }}</p>
        <p><strong>Fecha:</strong> {{ data.paymentResponse.timestamp | date:'medium' }}</p>
        
        <div *ngIf="data.paymentResponse.status === 'pending'" class="pending-warning">
          <mat-icon>info</mat-icon>
          <span>Su pago está siendo verificado</span>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cerrar</button>
      <button 
        *ngIf="data.paymentResponse.status === 'approved'"
        mat-button 
        color="primary"
        [mat-dialog-close]="true"
        routerLink="/trips">
        Ver mis viajes
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .payment-details {
      padding: 20px;
      line-height: 1.6;
    }
    .pending-warning {
      margin-top: 15px;
      padding: 10px;
      background-color: #FFF3E0;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    mat-icon[color="green"] {
      color: #4CAF50;
    }
    mat-icon[color="red"] {
      color: #F44336;
    }
    mat-icon[color="orange"] {
      color: #FF9800;
    }
  `]
})
export class PaymentConfirmationComponent {
  // El constructor recibe los datos del pago (si fue aprobado, rechazado o está pendiente)
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { paymentResponse: PaymentApiResponse }
  ) {}

  // Esta función devuelve el icono que se va a mostrar según el estado del pago
  get statusIcon(): string {
    // Si el pago fue aprobado, sale un "check"; si fue rechazado, sale un "error"; si está pendiente, sale un reloj
    return {
      'approved': 'check_circle',
      'rejected': 'error',
      'pending': 'schedule'
    }[this.data.paymentResponse.status];
  }

  // Esta función devuelve el color que se va a mostrar según el estado del pago
  get statusColor(): string {
    // Verde si está aprobado, rojo si fue rechazado, naranja si está pendiente
    return {
      'approved': 'green',
      'rejected': 'red',
      'pending': 'orange'
    }[this.data.paymentResponse.status];
  }
}