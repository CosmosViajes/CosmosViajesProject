import { Component, OnInit } from '@angular/core';
import { PaymentService } from '../../services/payment.service';
import { AuthService } from '../../services/auth.service';
import { DatePipe, CurrencyPipe, TitleCasePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-payments-history',
  standalone: true,
  imports: [DatePipe, CurrencyPipe, MatIconModule, TitleCasePipe],
  template: `
    <div class="payments-container">
      <h2 style="color:white">Historial de Pagos</h2>
      
      <div class="payment-cards">
        @for (payment of payments; track payment.id) {
          <div class="payment-card status-{{payment.status}}">
            <div class="payment-header">
              <h3>Pago #{{ payment.id }}</h3>
              <span class="status-badge">{{ payment.status | titlecase }}</span>
            </div>
            
            <div class="payment-details">
              <p><strong>Fecha:</strong> {{ payment.created_at | date:'medium' }}</p>
              <p><strong>Monto:</strong> {{ payment.amount | currency:'EUR' }}</p>
              <p><strong>Método:</strong> {{ payment.metadata?.payment_method }}</p>
              @if (payment.status === 'rejected') {
                <p class="rejection-reason">
                  <mat-icon>error_outline</mat-icon>
                  Motivo: {{ payment.rejection_reason || 'No especificado' }}
                </p>
              }
            </div>
          </div>
        }
        @empty {
          <div class="no-payments">
            No hay pagos registrados.
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .payments-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

h2 {
  font-weight: 700;
  font-size: 2.2rem;
  color: #222;
  margin-bottom: 1.5rem;
  text-align: center;
  letter-spacing: 0.03em;
}

.payment-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.8rem;
  margin-top: 1.5rem;
}

.payment-card {
  background: #fff;
  border-radius: 12px;
  padding: 1.8rem 2rem;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.08);
  border-left: 6px solid transparent;
  transition: box-shadow 0.3s ease, transform 0.3s ease;
  cursor: default;
}

.payment-card:hover {
  box-shadow: 0 12px 25px rgba(0, 0, 0, 0.15);
  transform: translateY(-4px);
}

.payment-card.status-pending {
  border-left-color: #ffc107;
}

.payment-card.status-approved {
  border-left-color: #28a745;
}

.payment-card.status-rejected {
  border-left-color: #dc3545;
}

.payment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.2rem;
}

.payment-header h3 {
  font-size: 1.3rem;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.status-badge {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.95rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  user-select: none;
}

.payment-card.status-pending .status-badge {
  background: #fff3cd;
  color: #856404;
}

.payment-card.status-approved .status-badge {
  background: #d4edda;
  color: #155724;
}

.payment-card.status-rejected .status-badge {
  background: #f8d7da;
  color: #721c24;
}

.payment-details p {
  margin: 0.5rem 0;
  font-size: 1rem;
  color: #555;
}

.payment-details strong {
  color: #222;
}

.rejection-reason {
  margin-top: 1rem;
  padding: 0.7rem 1rem;
  background: #ffe5e8;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: #dc3545;
  font-weight: 600;
  font-size: 0.95rem;
}

.rejection-reason mat-icon {
  font-size: 1.4rem;
}

.no-payments {
  grid-column: 1 / -1;
  text-align: center;
  color: #999;
  font-size: 1.2rem;
  padding: 3rem 1rem;
  font-style: italic;
}
  `]
})
export class PaymentsHistoryComponent implements OnInit {
  payments: any[] = []; // Aquí vamos a guardar la lista de pagos del usuario

  constructor(
    private paymentService: PaymentService, // Servicio para pedir los pagos al servidor
    private authService: AuthService // Servicio para saber quién es el usuario
  ) {}

  // Cuando se abre la página, llamamos a la función para cargar los pagos
  ngOnInit() {
    this.loadPayments();
  }

  // Esta función pide al servidor la lista de pagos del usuario
  loadPayments() {
    // Cogemos la información del usuario que está conectado
    const authStatus = this.authService.authStatus$.getValue();
    const userId = authStatus?.userData?.id;
    
    // Si tenemos el id del usuario, pedimos sus pagos
    if (userId) {
      this.paymentService.getUserPayments(userId).subscribe({
        next: (data) => this.payments = data, // Guardamos los pagos en la lista
        error: (err) => console.error('Error cargando pagos:', err) // Si hay error, lo mostramos en la consola
      });
    } else {
      // Si no hay usuario conectado, mostramos un mensaje de error
      console.error('Usuario no autenticado');
    }
  }  
}