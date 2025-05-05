import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { PaymentService } from '../../services/payment.service';
import { RequestService } from '../../services/request.service';
import { AuthService } from '../../services/auth.service';
import { StatsService } from '../../services/stats.service';
import { FormsModule } from '@angular/forms';
import { NgxChartsModule, Color } from '@swimlane/ngx-charts';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-panel-dialog',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    CurrencyPipe,
    DatePipe,
    TitleCasePipe,
    MatTabsModule,
    FormsModule,
    NgxChartsModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    MatDatepickerModule,
  ],
  providers: [provideNativeDateAdapter()],
  template: `
    <div class="admin-panel-modal">
      <h2 class="admin-panel-title">Panel de Administración</h2>
      <mat-tab-group>
        <!-- Pestaña de Gestión -->
        <mat-tab label="Gestión">
          <div class="section">
            <h3 class="section-title">
              <mat-icon class="section-icon">payment</mat-icon>
              Pagos Pendientes
            </h3>
            <div class="list-container">
              @if (payments.length === 0) {
              <div class="empty-list">No hay pagos pendientes</div>
              } @else { @for (payment of payments; track payment.id) {
              <div class="card-item">
                <div>
                  <div class="item-title">
                    #{{ payment.id }} - {{ payment.user?.name }}
                  </div>
                  <div class="item-detail">
                    {{ payment.amount | currency : 'EUR' }} ·
                    {{ payment.created_at | date : 'short' }}
                  </div>
                </div>
                <div class="actions">
                  <button
                    mat-icon-button
                    class="btn-accept"
                    (click)="acceptPayment(payment.id)"
                  >
                    <mat-icon class="icon-accept">check_circle</mat-icon>
                  </button>
                  <button
                    mat-icon-button
                    class="btn-deny"
                    (click)="rejectPayment(payment.id)"
                  >
                    <mat-icon class="icon-deny">cancel</mat-icon>
                  </button>
                </div>
              </div>
              } }
            </div>
          </div>

          <div class="section">
            <h3 class="section-title">
              <mat-icon class="section-icon">assignment_ind</mat-icon>
              Solicitudes Pendientes
            </h3>
            <div class="list-container">
              @if (pendingRequests.length === 0) {
              <div class="empty-list">No hay solicitudes pendientes</div>
              } @else { @for (request of pendingRequests; track request.id) {
              <div class="card-item">
                <div>
                  <div class="item-title">{{ request.user?.name }}</div>
                  <div class="item-detail">
                    {{ request.type | titlecase }} · {{ request.user?.email }}
                  </div>
                </div>
                <div class="actions">
                  <button
                    mat-icon-button
                    class="btn-accept"
                    (click)="approveRequest(request.id)"
                  >
                    <mat-icon class="icon-accept">check_circle</mat-icon>
                  </button>
                  <button
                    mat-icon-button
                    class="btn-deny"
                    (click)="rejectRequest(request.id)"
                  >
                    <mat-icon class="icon-deny">cancel</mat-icon>
                  </button>
                </div>
              </div>
              } }
            </div>
          </div>
        </mat-tab>

        <!-- Pestaña de Estadísticas -->
        <mat-tab label="Estadísticas">
          <div class="stats-controls">
            <div class="period-selector">
              <mat-form-field>
                <mat-label>Periodo</mat-label>
                <select
                  matNativeControl
                  [(ngModel)]="selectedPeriod"
                  (change)="onPeriodChange()"
                >
                  <option value="day">Diario</option>
                  <option value="month">Mensual</option>
                  <option value="year">Anual</option>
                </select>
              </mat-form-field>

              <mat-form-field *ngIf="selectedPeriod === 'day'">
                <mat-label>Seleccionar día</mat-label>
                <input
                  matInput
                  [matDatepicker]="dayPicker"
                  [(ngModel)]="selectedDate"
                  (dateChange)="onDaySelected($event)"
                />
                <mat-datepicker-toggle
                  matSuffix
                  [for]="dayPicker"
                ></mat-datepicker-toggle>
                <mat-datepicker #dayPicker></mat-datepicker>
              </mat-form-field>

              <mat-form-field *ngIf="selectedPeriod === 'month'">
                  <mat-label>Mes y año</mat-label>
                  <input matInput 
                        [matDatepicker]="monthPicker"
                        [value]="selectedMonth"
                        (dateChange)="onMonthSelected($event)">
                  <mat-datepicker-toggle matSuffix [for]="monthPicker"></mat-datepicker-toggle>
                  <mat-datepicker #monthPicker startView="year"></mat-datepicker>
              </mat-form-field>

              <mat-form-field *ngIf="selectedPeriod === 'year'">
                <mat-label>Año</mat-label>
                <input
                  matInput
                  type="number"
                  min="2024"
                  max="2027"
                  [(ngModel)]="selectedYear"
                  (change)="onYearSelected()"
                />
              </mat-form-field>
            </div>
          </div>

          <!-- Top Stats -->
          <div class="top-summary">
            <!-- Sección de Top Viajes -->
            <div class="top-card">
              <h4>Viaje más vendido</h4>
              @if (topTrips.length > 0) {
                <div class="top-item">
                  <div class="top-name">{{ topTrips[0].name }}</div>
                  <div class="top-count">{{ topTrips[0].reservations }} reservas</div>
                </div>
              } @else {
                <div class="no-data">
                  @if (selectedPeriod === 'day') {
                    No hubo reservas el {{ selectedDate | date:'dd/MM/yyyy' }}
                  } @else if (selectedPeriod === 'month') {
                    No hubo reservas en {{ selectedMonth | date:'MMMM yyyy' }}
                  } @else {
                    No hubo reservas en el año {{ selectedYear }}
                  }
                </div>
              }
            </div>

            <!-- Sección de Top Empresas -->
            <div class="top-card">
              <h4>Empresa top</h4>
              @if (topCompanies.length > 0) {
                <div class="top-item">
                  <div class="top-name">{{ topCompanies[0].name }}</div>
                  <div class="top-count">{{ topCompanies[0].purchases }} compras</div>
                </div>
              } @else {
                <div class="no-data">
                  @if (selectedPeriod === 'day') {
                    No hubo compras el {{ selectedDate | date:'dd/MM/yyyy' }}
                  } @else if (selectedPeriod === 'month') {
                    No hubo compras en {{ selectedMonth | date:'MMMM yyyy' }}
                  } @else {
                    No hubo compras en el año {{ selectedYear }}
                  }
                </div>
              }
            </div>
          </div>
          <div *ngIf="selectedPeriod === 'day'" class="full-list">
              <h4>Todos los viajes reservados</h4>
              @if (allTrips.length === 0) {
                  <div class="no-data">No hubo reservas de viajes este día</div>
              } @else {
                  <div class="list-container">
                      @for (trip of allTrips; track trip.id) {
                          <div class="list-item">
                              <span class="name">{{ trip.name }}</span>
                              <span class="count">{{ trip.reservations }} reservas</span>
                          </div>
                      }
                  </div>
              }
          </div>

          <!-- Debajo de la sección de Top Empresas -->
          <div *ngIf="selectedPeriod === 'day'" class="full-list">
              <h4>Todas las empresas que reservaron</h4>
              @if (allCompanies.length === 0) {
                  <div class="no-data">No hubo compras de empresas este día</div>
              } @else {
                  <div class="list-container">
                      @for (company of allCompanies; track company.id) {
                          <div class="list-item">
                              <span class="name">{{ company.name }}</span>
                              <span class="count">{{ company.purchases }} compras</span>
                          </div>
                      }
                  </div>
              }
          </div>

          <div class="charts-container" *ngIf="selectedPeriod !== 'day'">
            <div class="chart-card">
              <h4>{{ getChartTitle() }} - Reservas totales</h4>
              <ng-container *ngIf="!allTripsDataZero(); else noTripsData">
                <ngx-charts-bar-vertical
                  [animations]="false"
                  [view]="[800, 400]"
                  [results]="tripsData"
                  [xAxis]="true"
                  [yAxis]="true"
                  [yScaleMin]="yScaleMin"
                  [yScaleMax]="yScaleMax"
                  [barPadding]="barPadding"
                  [showXAxisLabel]="true"
                  [showYAxisLabel]="true"
                  [xAxisLabel]="getXAxisLabel()"
                  [xAxisTickFormatting]="xAxisTickFormatter"
                  [yAxisTickFormatting]="yAxisTickFormatter"
                  yAxisLabel="Reservas">
                </ngx-charts-bar-vertical>
              </ng-container>
              <ng-template #noTripsData>
                <div class="no-data">
                  <ng-container [ngSwitch]="selectedPeriod">
                    <span *ngSwitchCase="'day'">No hubo reservas el {{ selectedDate | date:'dd/MM/yyyy' }}</span>
                    <span *ngSwitchCase="'month'">No hubo reservas en {{ selectedMonth | date:'MMMM yyyy' }}</span>
                    <span *ngSwitchCase="'year'">No hubo reservas en el año {{ selectedYear }}</span>
                  </ng-container>
                </div>
              </ng-template>
            </div>

            <div class="chart-card">
              <h4>{{ getChartTitle() }} - Reservas de empresas</h4>
              <ng-container *ngIf="!allCompanyReservationsDataZero(); else noCompaniesData">
                <ngx-charts-bar-vertical
                  [animations]="false"
                  [view]="[800, 400]"
                  [results]="companyReservationsData"
                  [xAxis]="true"
                  [yAxis]="true"
                  [yScaleMin]="yScaleMin"
                  [yScaleMax]="yScaleMax"
                  [barPadding]="barPadding"
                  [showXAxisLabel]="true"
                  [showYAxisLabel]="true"
                  [xAxisLabel]="getXAxisLabel()"
                  [xAxisTickFormatting]="xAxisTickFormatter"
                  [yAxisTickFormatting]="yAxisTickFormatter"
                  yAxisLabel="Compras">
                </ngx-charts-bar-vertical>
              </ng-container>
              <ng-template #noCompaniesData>
                <div class="no-data">
                  <ng-container [ngSwitch]="selectedPeriod">
                    <span *ngSwitchCase="'day'">No hubo compras el {{ selectedDate | date:'dd/MM/yyyy' }}</span>
                    <span *ngSwitchCase="'month'">No hubo compras en {{ selectedMonth | date:'MMMM yyyy' }}</span>
                    <span *ngSwitchCase="'year'">No hubo compras en el año {{ selectedYear }}</span>
                  </ng-container>
                </div>
              </ng-template>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [
    `
      .admin-panel-modal {
        min-width: 1100px;
        max-width: 98vw;
        height: 92vh;
        max-height: 92vh;
        min-height: 600px;
        margin: 2vh auto;
        padding: 2.5rem 2rem 2rem 2rem;
        background: #f4f6fa;
        border-radius: 18px;
        box-shadow: 0 8px 32px rgba(30, 30, 30, 0.15);
        overflow-y: auto;
        display: flex;
        flex-direction: column;
      }
      .no-data {
        background: #fff3cd;
        color: #856404;
        padding: 1rem;
        border-radius: 8px;
        margin-top: 1rem;
        text-align: center;
      }
      .mat-calendar-period-button {
          display: none !important;
      }

      .mat-calendar-controls {
          justify-content: center !important;
      }
      .full-list {
          margin-top: 2rem;
          background: #fff;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .list-container {
          max-height: 400px;
          overflow-y: auto;
          margin-top: 1rem;
      }

      .list-item {
          display: flex;
          justify-content: space-between;
          padding: 0.8rem;
          border-bottom: 1px solid #eee;
          
          &:last-child {
              border-bottom: none;
          }
          
          .name {
              color: #1a237e;
          }
          
          .count {
              color: #43A047;
              font-weight: 500;
          }
      }

      .top-item {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 8px;
        margin-top: 1rem;
      }
      .period-selector {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
      }
      .top-summary {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        margin-bottom: 2rem;
      }
      .top-card {
        background: #fff;
        padding: 1.5rem;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      .top-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 1rem;
      }
      .top-name {
        font-size: 1.2rem;
        font-weight: 600;
        color: #1a237e;
      }
      .top-count {
        font-size: 1.4rem;
        color: #43a047;
        font-weight: 700;
      }
      .charts-container {
        display: grid;
        gap: 2rem;
      }
      .chart-card {
        background: #fff;
        padding: 2rem;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        max-width: 100%;
        overflow-x: auto;
      }
      ngx-charts-bar-vertical {
        display: block;
        width: 100% !important;
        min-width: 0;
      }

      .admin-panel-title {
        font-size: 2.3rem;
        font-weight: bold;
        color: #222;
        margin-bottom: 2rem;
        letter-spacing: 1px;
        text-align: center;
        text-shadow: 0 2px 8px #e2e2e2;
      }
      .section {
        margin-bottom: 2.5rem;
        background: #fff;
        border-radius: 14px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
        padding: 1.5rem 1.5rem 1rem 1.5rem;
      }
      .section-title {
        font-size: 1.35rem;
        color: #1a237e;
        margin-bottom: 1.1rem;
        display: flex;
        align-items: center;
        gap: 0.6rem;
        letter-spacing: 0.5px;
      }
      .section-icon {
        font-size: 1.6rem;
        color: #4f8cff;
        vertical-align: middle;
      }
      .list-container {
        min-height: 60px;
      }
      .empty-list {
        text-align: center;
        color: #888;
        padding: 1.5rem 0;
        font-size: 1.1rem;
        letter-spacing: 0.3px;
      }
      .card-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #f8faff;
        border-radius: 9px;
        padding: 1rem 1.5rem;
        margin-bottom: 1rem;
        box-shadow: 0 1px 6px rgba(80, 120, 200, 0.06);
        transition: box-shadow 0.2s, background 0.2s;
      }
      .card-item:hover {
        box-shadow: 0 4px 16px rgba(80, 120, 200, 0.13);
        background: #eaf3ff;
      }
      .item-title {
        font-weight: 700;
        color: #232323;
        font-size: 1.13rem;
        letter-spacing: 0.2px;
      }
      .item-detail {
        color: #3266b8;
        font-size: 0.99rem;
        margin-top: 0.2rem;
        letter-spacing: 0.1px;
      }
      .actions {
        display: flex;
        gap: 0.6rem;
      }
      .btn-accept {
        background: #43a047 !important;
        color: #fff !important;
        border-radius: 50%;
        transition: background 0.2s;
        box-shadow: 0 2px 8px rgba(67, 160, 71, 0.09);
      }
      .btn-accept:hover {
        background: #388e3c !important;
      }
      .btn-deny {
        background: #e53935 !important;
        color: #fff !important;
        border-radius: 50%;
        transition: background 0.2s;
        box-shadow: 0 2px 8px rgba(229, 57, 53, 0.09);
      }
      .btn-deny:hover {
        background: #b71c1c !important;
      }
      .icon-accept {
        color: #fff !important;
        margin-bottom: 3px;
      }
      .icon-deny {
        color: #fff !important;
        margin-bottom: 3px;
      }
      .stats-controls {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        margin: 1.3rem 0 0.7rem 0;
        gap: 0.7rem;
      }
      .period-label {
        font-weight: 600;
        color: #1a237e;
        font-size: 1.05rem;
        margin-right: 0.5rem;
      }
      select {
        padding: 8px 18px;
        border-radius: 8px;
        border: 1px solid #c5d0e6;
        font-size: 1rem;
        background: #f8faff;
        color: #1a237e;
        outline: none;
        transition: border 0.2s;
      }
      select:focus {
        border: 1.5px solid #4f8cff;
      }
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 2rem;
        margin-top: 1.5rem;
      }
      .stats-card {
        background: #fff;
        padding: 1.7rem 1.3rem 1.2rem 1.3rem;
        border-radius: 14px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
        min-height: 230px;
      }
      .stats-card h4 {
        color: #1a237e;
        margin-bottom: 1.1rem;
        font-size: 1.18rem;
        font-weight: 700;
        letter-spacing: 0.1px;
      }
      .stats-card ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .stats-card li {
        padding: 0.6rem 0;
        border-bottom: 1px solid #e7eaf3;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 1.08rem;
      }
      .stats-card li:last-child {
        border-bottom: none;
      }
      .stat-name {
        color: #222;
        font-weight: 600;
      }
      .stat-count {
        color: #43a047;
        font-weight: 700;
        font-size: 1.08rem;
        margin-left: 0.4rem;
      }
      .chart-placeholder {
        height: 260px;
        background: linear-gradient(120deg, #f0f5ff 0%, #e9f0fb 100%);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: 1rem;
      }
      .chart-placeholder img {
        max-height: 90%;
        max-width: 90%;
        opacity: 0.7;
      }
      .loading {
        text-align: center;
        padding: 2rem;
        color: #666;
        font-size: 1.12rem;
      }
      .full-width {
        grid-column: 1 / -1;
      }
      @media (max-width: 900px) {
        .admin-panel-modal {
          min-width: 95vw;
          padding: 1.2rem;
        }
        .stats-grid {
          grid-template-columns: 1fr;
        }
      }
    
    ngx-charts-bar-vertical .bar {
        stroke-width: 1px;
        stroke: #fff;
    }

    .chart-legend {
        max-height: 120px;
        overflow-y: auto;
    }
    `,
  ],
})
export class AdminPanelDialogComponent {
  payments: any[] = [];
  requests: any[] = [];
  selectedPeriod: string = 'day';
  selectedDate: Date = new Date();
  selectedMonth: Date = new Date();
  selectedYear: number = new Date().getFullYear();
  topTrips: any[] = [];
  topCompanies: any[] = [];
  loadingStats: boolean = false;
  dailyUserReservations: number | null = null;
  dailyCompanyPurchases: number | null = null;
  allTrips: any[] = [];
  allCompanies: any[] = [];
  barPadding: number = 15;
  yScaleMin: number = 0;
  yScaleMax: number = 5;

  companyReservationsData: any[] = [];

  colorScheme: Color = {
    name: 'custom',
    selectable: true,
    domain: ['#5AA454', '#C7B42C', '#AAAAAA'],
  } as Color;

  tripsData: any[] = [];
  companiesData: any[] = [];

  get pendingRequests() {
    return this.requests.filter((r) => r.status === 'pending');
  }

  constructor(
    private paymentService: PaymentService,
    private requestService: RequestService,
    private statsService: StatsService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadPendingPayments();
    this.loadRequests();
    this.loadStats();
  }

  onPeriodChange() {
    this.loadStats();
  }

  onDaySelected(event: MatDatepickerInputEvent<Date>) {
    if (event.value) {
        // Convertir a UTC manteniendo la fecha visual
        const utcDate = new Date(Date.UTC(
            event.value.getFullYear(),
            event.value.getMonth(),
            event.value.getDate()
        ));
        this.selectedDate = utcDate;
        this.loadStats();
    }
  }

  onMonthSelected(event: MatDatepickerInputEvent<Date>) {
    if (event.value) {
        const year = event.value.getFullYear();
        const month = event.value.getMonth();
        // Obtener último día del mes seleccionado
        const lastDay = new Date(year, month + 1, 0); 
        this.selectedMonth = lastDay;
        this.loadStats();
    }
  }

  onYearSelected() {
    this.loadStats();
  }

  getChartTitle(): string {
    return {
      day: 'Día',
      month: 'Mes',
      year: 'Año',
    }[this.selectedPeriod] as string;
  }

  getXAxisLabel(): string {
    return {
      day: 'Horas',
      month: 'Semanas',
      year: 'Meses',
    }[this.selectedPeriod] as string;
  }

  loadStats() {
    this.loadingStats = true;
    // Resetear datos anteriores
    this.topTrips = [];
    this.topCompanies = [];
    this.dailyUserReservations = null;
    this.dailyCompanyPurchases = null;

    const params = {
      period: this.selectedPeriod,
      date: this.selectedDate,
      month: this.selectedMonth,
      year: this.selectedYear
    };

    this.statsService.getAdvancedStats(params).subscribe({
      next: (data) => {
        this.topTrips = data.topTrips;
        this.topCompanies = data.topCompanies;
        this.allTrips = data.allTrips;
        this.allCompanies = data.allCompanies;
        this.tripsData = this.formatChartData(data.trendData, 'Reservas totales');
        this.companyReservationsData = this.formatChartData(data.companyReservationsTrend, 'Reservas de empresas');
        
        if (this.selectedPeriod === 'day') {
          this.dailyUserReservations = data.dailyUserReservations ?? 0;
          this.dailyCompanyPurchases = data.dailyCompanyPurchases ?? 0;
        }

        this.loadingStats = false;
      },
      error: (err) => {
        console.error('Error cargando estadísticas:', err);
        this.loadingStats = false;
      },
    });
  }

  loadPendingPayments() {
    this.paymentService.getPendingPayments().subscribe({
      next: (response) => {
        this.payments = response;
      },
      error: (err) => {
        console.error('Error cargando pagos:', err);
        Swal.fire(
          'Error',
          'No se pudieron cargar los pagos pendientes',
          'error'
        );
      },
    });
  }

  loadRequests() {
    this.requestService.getRequests().subscribe({
      next: (data) => (this.requests = data),
      error: (err) => console.error('Error cargando solicitudes:', err),
    });
  }

  acceptPayment(paymentId: number) {
    this.paymentService.acceptPayment(paymentId).subscribe({
      next: () => {
        this.payments = this.payments.filter((p) => p.id !== paymentId);
        Swal.fire('¡Aceptado!', 'El pago fue aprobado exitosamente', 'success');
      },
      error: (err) => {
        console.error('Error aceptando pago:', err);
        Swal.fire('Error', 'No se pudo aceptar el pago', 'error');
      },
    });
  }

  rejectPayment(paymentId: number) {
    this.paymentService.rejectPayment(paymentId).subscribe({
      next: () => {
        this.payments = this.payments.filter((p) => p.id !== paymentId);
        Swal.fire('¡Rechazado!', 'El pago fue cancelado', 'success');
      },
      error: (err) => {
        console.error('Error rechazando pago:', err);
        Swal.fire('Error', 'No se pudo rechazar el pago', 'error');
      },
    });
  }

  approveRequest(requestId: number) {
    this.requestService.updateRequest(requestId, 'approved').subscribe({
      next: (updatedRequest: any) => {
        this.authService
          .updateUserRole(updatedRequest.user_id, updatedRequest.type)
          .subscribe(() => {
            this.requests = this.requests.filter((r) => r.id !== requestId);
            Swal.fire('¡Aprobado!', 'Rol actualizado correctamente', 'success');
          });
      },
    });
  }

  rejectRequest(requestId: number) {
    this.requestService.updateRequest(requestId, 'rejected').subscribe({
      next: () => {
        this.requests = this.requests.filter((r) => r.id !== requestId);
        Swal.fire('Rechazado', 'Solicitud denegada', 'success');
      },
    });
  }

  private formatChartData(rawData: any[] | undefined, label: string): any[] {
      const data = rawData || [];

      if (this.selectedPeriod === 'day') {
        return Array.from({length: 24}, (_, hour) => {
            const utcHour = hour.toString().padStart(2, '0');
            const existing = data.find(d => d.label === `${utcHour}:00`);
            return {
                name: `${utcHour}:00`,
                value: existing?.total || 0,
                extra: { type: label }
            };
        });
    }

    if (this.selectedPeriod === 'month') {
        const year = this.selectedMonth.getFullYear();
        const month = this.selectedMonth.getMonth(); // 0-indexed
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const completeData = [];
        for (let day = 1; day <= daysInMonth; day++) {
            // El backend debe devolver d.label como número de día (1,2,3...)
            const existing = data.find(d => Number(d.label) === day);
            completeData.push({
                name: day.toString(),
                value: existing?.total || 0,
                extra: { type: label }
            });
        }
        return completeData;
    }

    const safeData = data.map(item => ({
      label: item.label,
      total: Math.round(Number(item.total)) || 0 // Fuerza número entero
    }));

    if (this.selectedPeriod === 'year') {
      return Array.from({length: 12}, (_, index) => {
          const monthNumber = index + 1;
          const existing = (rawData || []).find(d => 
              Number(d.label) === monthNumber
          );
          
          return {
              name: this.translateMonthByNumber(monthNumber),
              value: existing?.total || 0,
              extra: { type: label }
          };
      });
    }

    return (rawData || []).map(item => ({
        name: item.label,
        value: Math.round(Number(item.total) || 0),
        extra: { type: label }
    }));
  }

  private translateMonthByNumber(monthNumber: number): string {
    const months: { [key: number]: string } = {
        1: 'Ene', 2: 'Feb', 3: 'Mar', 4: 'Abr',
        5: 'May', 6: 'Jun', 7: 'Jul', 8: 'Ago',
        9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dic'
    };
    return months[monthNumber] || '';
}

  xAxisTickFormatter = (tick: string | number) => {
    if (this.selectedPeriod === 'month') {
      const day = tick.toString().padStart(2, '0');
      const month = this.selectedMonth.getMonth();
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return `${day} ${monthNames[month]}`;
    }
    if (this.selectedPeriod === 'year') {
      if (typeof tick === 'number') {
          return this.translateMonthByNumber(tick);
      }
      return this.translateMonthByNumber(parseInt(tick, 10));
    }
    
    return tick;
  };
  
  yAxisTickFormatter = (value: number): string => {
    return Math.round(value).toString();
  };

  allTripsDataZero(): boolean {
    return Array.isArray(this.tripsData) && this.tripsData.every(d => Number(d.value) === 0);
  }
  
  allCompanyReservationsDataZero(): boolean {
    return Array.isArray(this.companyReservationsData) && this.companyReservationsData.every(d => Number(d.value) === 0);
  }  

}