import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlightCardComponent } from '../flight-card/flight-card.component';
import { SearchBarComponent } from '../search-bar/search-bar.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TripService } from '../../services/trip.service';
import { Flight } from '../../models/flight.model';
import { timer, Subscription } from 'rxjs';
import { switchMap, takeWhile, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-flights-list',
  standalone: true,
  imports: [CommonModule, FlightCardComponent, SearchBarComponent, MatIconModule, MatButtonModule],
  template: `
<section class="flights-container bg-[#04040a] w-full min-h-screen relative overflow-hidden flex flex-col">
  <!-- Estrellas dinámicas -->
  <div class="stars top-0 left-0 w-full h-full z-[1] pointer-events-none" style="position: absolute;">
    <div
      *ngFor="let star of starsArray"
      class="dynamic-star"
      [style.top]="star.top"
      [style.left]="star.left"
      [style.opacity]="star.opacity"
    ></div>
  </div>

  <!-- Parte Superior SIEMPRE ARRIBA -->
  <div class="top-section relative flex flex-col items-center justify-center z-[20] px-4 pt-4 mb-[30px]">
    <h2 class="section-title text-3xl md:text-4xl font-extrabold text-center text-yellow-400 mb-2">
      PRÓXIMOS VUELOS DISPONIBLES
    </h2>
    <div class="search-section relative w-full max-w-4xl">
      <app-search-bar (searchChange)="filterFlights($event)"></app-search-bar>
    </div>
  </div>

  <!-- Notificación de actualización -->
  <div *ngIf="showUpdateNotification" 
     class="fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-[9999] animate-fade-in">
    <div class="flex items-center gap-3">
      <mat-icon>flight_takeoff</mat-icon>
      <div>
        <p class="font-medium">¡Nuevos vuelos disponibles!</p>
        <button (click)="applyUpdates()" class="text-white hover:text-gray-200 mt-1">
          Mostrar ahora
        </button>
      </div>
    </div>
  </div>

  <!-- Listado de vuelos o estado de carga -->
  <div class="flights-list w-full flex justify-center pb-4">
    <div class="grid grid-cols-1 gap-8 w-full max-w-6xl px-2">
    @if (isLoading) {
      <div class="col-span-full flex justify-center py-12">
        <div class="animate-pulse flex flex-col items-center gap-4">
          <div class="h-12 w-12 bg-blue-200 rounded-full"></div>
          <p class="text-gray-500">Cargando vuelos...</p>
        </div>
      </div>
    } @else {
      @if (filteredFlights.length > 0) {
        @for (flight of filteredFlights; track flight.id) {
          <app-flight-card
            [flight]="flight"
            class="flight-card-grid"
          ></app-flight-card>
        }
      } @else {
        <div class="col-span-full flex flex-col items-center py-12">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <h3 class="mt-4 text-lg font-medium text-red-500">
            @if (hasError) {
              <div class="col-span-full flex flex-col items-center py-12">
                <mat-icon class="text-red-500 text-4xl mb-4">error_outline</mat-icon>
                <h3 class="text-lg font-medium text-red-500 mb-2">
                  Error de conexión con el servidor
                </h3>
                <p class="text-gray-400 text-sm mb-4">
                  Intentando reconectar automáticamente...
                </p>
              </div>
            } @else {
              No hay vuelos disponibles
            }
          </h3>
          <button 
            (click)="startInitialLoad()"
            class="mt-4 px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-colors"
          >
            <div class="flex items-center gap-2">
              <mat-icon>refresh</mat-icon>
              Intentar de nuevo
            </div>
          </button>
        </div>
      }
    }
    </div>
  </div>

  <!-- Estado de actualización automática -->
  <div *ngIf="lastUpdated" class="text-center text-gray-400 pb-2">
    Última actualización: {{ lastUpdated | date:'HH:mm:ss' }}
    <span *ngIf="isCheckingForUpdates" class="ml-2">
      <mat-icon class="animate-pulse text-sm">autorenew</mat-icon>
    </span>
  </div>
</section>
`,
  styles: [`

/* Asegurar que la parte superior tenga z-index alto */
.top-section {
  position: relative;
  z-index: 50; /* Mayor que el menú (ejemplo: menú z-40) */
  padding-top: 1rem; /* Espacio extra para evitar tapado */
}

/* Ajusta el contenedor principal para que no quede oculto bajo el menú fijo */
.flights-container {
  padding-top: 70px; /* Altura aproximada del menú fijo */
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

/* Si el menú tiene z-index 40, aseguramos que el contenido tenga más */
nav.menu {
  z-index: 40;
  position: fixed;
  top: 0;
  width: 100%;
}

/* Si usas Angular Material u otro menú, ajusta su z-index para que quede detrás */
.mat-mdc-sidenav-container {
  z-index: 30 !important;
}

.middle-section {
  position: relative; /* Para que la tierra se posicione dentro */
}

/* Ajustes para móvil */
@media (max-width: 768px) {
  
  .section-title {
    font-size: 1.8rem;
    margin-bottom: 0.5rem;
  }
  
}

.dynamic-star {
  position: absolute;
  width: 3px;
  height: 3px;
  background-color: rgba(252, 242, 100, 0.99);
  border-radius: 50%;
  pointer-events: none;
}

.fullscreen-loader {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  z-index: 1000;
}

/* Añadir estas transiciones */
.no-results {
  transition: opacity 0.3s ease;
}

.middle-section {
  position: relative;
}

.fixed {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  min-width: 250px;
  z-index: 1000;
}

.flight-card-responsive {
  width: 95%;
  max-width: 900px;
  min-width: 320px;
  margin: 10px auto;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
  background: #161622;
  transition: box-shadow 0.2s, transform 0.2s;
}

.flight-card-grid:hover {
  box-shadow: 0 4px 20px rgba(252, 242, 100, 0.15);
  transform: translateY(-4px) scale(1.01);
}
  
.flights-list {
  padding-bottom: 2rem;
}

.flight-card-grid {
  @apply w-full p-3 bg-[#161622] border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300;
  margin: 0 auto;
}

.shadow-lg {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}

`],
})
export class FlightsListComponent implements OnInit, OnDestroy {
  // Aquí guardamos datos para dibujar estrellas de fondo (es solo decoración)
  starsArray: { top: string; left: string; opacity: number; transition: boolean }[] = [];

  showNoResults = false; // Si no hay resultados en la búsqueda, mostramos un mensaje
  searchTimer: any; // Temporizador para la búsqueda
  searching = false; // Si estamos buscando, esto es true

  isLoading = true; // Si estamos cargando los vuelos, esto es true
  showRefresh = false; // Si hace falta mostrar el botón de refrescar
  lastUpdated?: Date; // Fecha de la última actualización de la lista
  isCheckingForUpdates = false; // Si estamos comprobando si hay vuelos nuevos

  private maxLoadTimer: any;

  hasError = false; // Si hay un error cargando los vuelos
  flights: Flight[] = []; // Aquí guardamos todos los vuelos que nos llegan del servidor
  filteredFlights: Flight[] = []; // Aquí guardamos los vuelos que coinciden con la búsqueda

  private pollingSubscription?: Subscription; // Para actualizar la lista cada cierto tiempo

  initialLoad = true; // Si es la primera vez que cargamos los vuelos
  loadTimer: any; // Temporizador para la carga inicial
  currentSearch = ''; // Lo que el usuario ha escrito en la barra de búsqueda

  constructor(private tripService: TripService, private cdr: ChangeDetectorRef) {}

  private loadFlightsSubscription?: Subscription;

  showUpdateNotification = false; // Si hay vuelos nuevos o se han quitado, mostramos un aviso
  private isComponentAlive = true; // Para saber si el componente sigue activo

  // Dibuja muchas estrellas para el fondo
  generateStars(): void {
    const totalStars = 500;
    for (let i = 0; i < totalStars; i++) {
      this.starsArray.push({
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        opacity: Math.random() * (0.3 - 0.1) + 0.1,
        transition: false
      });
    }
  }

  // Cambia algunas estrellas de sitio y brillo para que parezca que parpadean
  updateRandomStars(): void {
    const starsToUpdate = Math.floor(Math.random() * (50 - 10) + 10);
    for (let i = 0; i < starsToUpdate; i++) {
      const randomIndex = Math.floor(Math.random() * this.starsArray.length);

      this.starsArray[randomIndex].transition = true;
      this.starsArray[randomIndex].opacity = 0;

      setTimeout(() => {
        this.starsArray[randomIndex] = {
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          opacity: Math.random() * (1 - 0.5) + 0.5,
          transition: true
        };
      }, 5000);
    }
  }

  // Cuando se inicia el componente
  ngOnInit(): void {
    this.startInitialLoad(); // Cargamos los vuelos por primera vez
    this.generateStars(); // Dibujamos las estrellas
    
    setInterval(() => {
      this.updateRandomStars();
    }, Math.random() * (1000 - 500) + 500);
  }

  // Carga inicial de los vuelos
  public startInitialLoad(): void {
    // Resetear estados completamente
    this.isLoading = true;
    this.hasError = false;
    this.flights = [];
    this.filteredFlights = [];
    this.clearLoadTimer();

    // Temporizador más corto para desarrollo (5s)
    this.maxLoadTimer = setTimeout(() => {
      if (this.isLoading) {
        this.handleLoadError(new Error('Timeout'), true); // Forzar error solo si sigue loading
      }
    }, 5000);

    this.loadFlights();
  }


  // Si el usuario pulsa refrescar, volvemos a cargar los vuelos
  handleManualRefresh(): void {
    this.showUpdateNotification = false;
    this.loadFlights();
  }

  // Cuando se destruye el componente, paramos los temporizadores y actualizaciones
  ngOnDestroy(): void {
    this.isComponentAlive = false;
    this.pollingSubscription?.unsubscribe();
    this.clearLoadTimer();
    
    // Limpiar la subscripción de carga
    if (this.loadFlightsSubscription) {
      this.loadFlightsSubscription.unsubscribe();
    }
  }

  // Pedimos la lista de vuelos al servidor
  private loadFlights(): void {
    this.loadFlightsSubscription = this.tripService.getFlights().subscribe({
      next: (data) => this.handleFlightData(data),
      error: (err) => this.handleLoadError(err)
    });
  }

  // Quitamos el temporizador de carga si ya no hace falta
  private clearLoadTimer(): void {
    if (this.maxLoadTimer) {
      clearTimeout(this.maxLoadTimer);
      this.maxLoadTimer = null;
    }
  }

  // Si hay error cargando los vuelos, lo mostramos y vaciamos las listas
  private handleLoadError(err: any, isTimeout: boolean = false): void {
    // Solo marcar error si es timeout y no hay vuelos
    if (isTimeout && this.flights.length === 0) {
      this.hasError = true;
    }
    
    this.isLoading = false;
    this.cdr.detectChanges(); // Forzar actualización de vista

    // Reintentar después de 1s solo si no hay datos
    if (this.flights.length === 0) {
      setTimeout(() => {
        if (this.isComponentAlive) this.startInitialLoad();
      }, 100);
    }
  }

  // Cada 10 segundos, pedimos los vuelos al servidor para ver si hay cambios
  private startPolling(): void {
    // Detener polling existente si hay
    this.pollingSubscription?.unsubscribe(); 
    
    this.pollingSubscription = timer(15000, 15000).pipe( // Esperar 15s después de carga inicial
      takeWhile(() => this.isComponentAlive),
      switchMap(() => this.tripService.getFlights()),
      distinctUntilChanged((prev, curr) => 
        JSON.stringify(prev) === JSON.stringify(curr)
      )
    ).subscribe({
      next: (data) => this.handlePollingUpdate(data),
      error: (err) => console.error('Error en polling:', err)
    });
  }

  private handlePollingUpdate(newData: Flight[]): void {
    if (newData.length > this.flights.length) {
      this.showUpdateNotification = true;
      setTimeout(() => this.showUpdateNotification = false, 5000);
    }
    this.flights = newData;
    this.filterFlights(this.currentSearch);
  }

  animationState = 'idle'; // Para animaciones de búsqueda

  // Cuando recibimos los vuelos, los guardamos y filtramos según la búsqueda
  public handleFlightData(data: Flight[]): void {
    // 1. Limpiar temporizador PRIMERO (esto es crítico)
    this.clearLoadTimer();

    // 2. Actualizar estados Y DATOS de forma atómica
    this.hasError = false;
    this.isLoading = false;
    this.flights = data;
    this.filterFlights(this.currentSearch);

    // 3. Forzar detección de cambios inmediata
    this.cdr.detectChanges(); // Necesitarás inyectar ChangeDetectorRef en el constructor

    // 4. Iniciar polling solo si es la primera carga
    if (this.initialLoad) {
      this.startPolling();
      this.initialLoad = false;
    }
  }

  // Filtra los vuelos según lo que el usuario ha escrito en la barra de búsqueda
  filterFlights(searchTerm: string): void {
    this.currentSearch = searchTerm.toLowerCase();
    this.searching = true;
    this.showNoResults = false;

    if (this.searchTimer) clearTimeout(this.searchTimer);

    // Espera 3 segundos antes de mostrar los resultados (como una búsqueda con retraso)
    this.searchTimer = setTimeout(() => {
      this.filteredFlights = this.flights.filter(flight => 
        (flight.name?.toLowerCase() || '').includes(this.currentSearch) ||
        (flight.company?.name?.toLowerCase() || '').includes(this.currentSearch) ||
        (flight.type?.toLowerCase() || '').includes(this.currentSearch) ||
        (new Date(flight.departure).toLocaleDateString('es-ES') || '').includes(this.currentSearch) ||
        (flight.duration?.toString() || '').includes(this.currentSearch)
      );
      this.searching = false;
      this.showNoResults = this.filteredFlights.length === 0;
    }, 500);
  }

  // Cuando termina una animación, comprobamos si seguimos buscando
  onAnimationDone() {
    if (this.searching) {
      this.animationState = 'searching';
    }
  }

  public applyUpdates(): void {
    this.filterFlights(this.currentSearch);
    this.showUpdateNotification = false;
  }

}