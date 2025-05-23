import { Component, OnInit, OnDestroy  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlightCardComponent } from '../flight-card/flight-card.component';
import { SearchBarComponent } from '../search-bar/search-bar.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TripService } from '../../services/trip.service';
import { Flight } from '../../models/flight.model';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { timer, Subscription } from 'rxjs';
import { switchMap, takeWhile, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-flights-list',
  standalone: true,
  imports: [CommonModule, FlightCardComponent, SearchBarComponent, MatIconModule, MatButtonModule],
  animations: [
    trigger('spin', [
      state('searching', style({ transform: 'rotate(0deg)' })),
      state('idle', style({ transform: 'rotate(360deg)' })),
      transition('searching => idle', animate('2000ms linear'))
    ]),
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-out', 
          style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', 
          style({ opacity: 0, transform: 'translateY(20px)' }))
      ])
    ])
  ],
  template: `
<section class="flights-container bg-[#04040a] w-full min-h-screen relative overflow-hidden flex flex-col">
  <!-- Contenido principal -->
  <div *ngIf="!isLoading" class="flex flex-col h-full">
    <!-- Estrellas dinámicas -->
    <div class="stars top-0 left-0 w-full h-full z-[1] pointer-events-none">
      <div
        *ngFor="let star of starsArray"
        class="dynamic-star"
        [style.top]="star.top"
        [style.left]="star.left"
        [style.opacity]="star.opacity"
      ></div>
    </div>

    <!-- Parte Superior (10vh) -->
    <div class="top-section relative min-h-[10vh] flex flex-col items-center justify-center z-[20] px-4 pt-4">
      <!-- Título -->
      <h2 class="section-title text-3xl md:text-4xl font-extrabold text-center text-yellow-400 mb-2">
        PRÓXIMOS VUELOS DISPONIBLES
      </h2>

      <!-- Buscador -->
      <div class="search-section relative w-full max-w-4xl">
        <app-search-bar (searchChange)="filterFlights($event)"></app-search-bar>
      </div>
    </div>

    <!-- Parte Central (80vh) -->
    <div class="middle-section relative min-h-[80vh] flex-1 z-[30] overflow-y-auto px-4 md:px-8" style="margin-top: 25px;">
      <!-- Notificación de actualización -->
      <div *ngIf="showUpdateNotification" 
           @fadeInOut
           class="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg z-[9999]">
        <div class="flex items-center gap-3">
          <mat-icon class="text-yellow-500">notifications</mat-icon>
          <div>
            <p class="font-medium">¡Nuevos vuelos disponibles!</p>
            <button (click)="handleManualRefresh()" class="text-yellow-400 hover:text-yellow-300 mt-1">
              Actualizar lista
            </button>
          </div>
        </div>
      </div>

      <!-- Listado de vuelos -->
      <div class="flights-list flex flex-col gap-4 w-full pb-4">
        <ng-container *ngIf="filteredFlights.length > 0; else noResults">
          <app-flight-card
            *ngFor="let flight of filteredFlights"
            [flight]="flight"
            class="w-full"
          ></app-flight-card>
        </ng-container>

        <ng-template #noResults>
          <div class="no-results flex flex-col items-center justify-center text-center text-yellow-400 h-full py-8">
            <div *ngIf="searching" class="mb-6 flex flex-col items-center">
              <svg class="w-16 h-16 text-yellow-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              <p class="text-xl md:text-2xl font-medium text-gray-300 mt-2">Buscando vuelos...</p>
            </div>

            <div *ngIf="!searching && showNoResults">
              <p class="text-xl md:text-2xl font-medium text-gray-300">
                No se encontraron vuelos que coincidan con "{{ currentSearch }}"
              </p>
            </div>
          </div>
        </ng-template>
      </div>
    </div>

    <!-- Estado de actualización automática -->
    <div *ngIf="lastUpdated" class="text-center text-gray-400 pb-2">
      Última actualización: {{ lastUpdated | date:'HH:mm:ss' }}
      <span *ngIf="isCheckingForUpdates" class="ml-2">
        <mat-icon class="animate-pulse text-sm">autorenew</mat-icon>
      </span>
    </div>
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
  height: calc(100vh - 70px); /* Ajustar altura para scroll correcto */
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

.animate-spin {
  animation: spin 1.5s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.shadow-lg {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
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

  hasError = false; // Si hay un error cargando los vuelos
  flights: Flight[] = []; // Aquí guardamos todos los vuelos que nos llegan del servidor
  filteredFlights: Flight[] = []; // Aquí guardamos los vuelos que coinciden con la búsqueda

  private pollingSubscription?: Subscription; // Para actualizar la lista cada cierto tiempo

  initialLoad = true; // Si es la primera vez que cargamos los vuelos
  loadTimer: any; // Temporizador para la carga inicial
  currentSearch = ''; // Lo que el usuario ha escrito en la barra de búsqueda

  constructor(private tripService: TripService) {}

  private previousFlights: Flight[] = []; // Guardamos la lista anterior para ver si ha cambiado
  showUpdateNotification = false; // Si hay vuelos nuevos o se han quitado, mostramos un aviso
  private isComponentAlive = true; // Para saber si el componente sigue activo
  private pollingInterval = 10000; // Cada cuánto tiempo (en milisegundos) miramos si hay vuelos nuevos (10 segundos)

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

    // Cada poco tiempo, cambiamos algunas estrellas para que el fondo se vea animado
    setInterval(() => {
      this.updateRandomStars();
    }, Math.random() * (1000 - 500) + 500);
  }

  // Carga inicial de los vuelos
  private startInitialLoad(): void {
    this.isLoading = true;
    this.hasError = false;
    
    // Siempre mostramos el "cargando" al menos 2 segundos para que no parpadee
    this.loadTimer = setTimeout(() => {
      this.isLoading = false;
    }, 2000);

    this.loadFlights(); // Pedimos los vuelos al servidor
    this.startPolling(); // Empezamos a mirar si hay vuelos nuevos cada cierto tiempo
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
    if (this.searchTimer) clearTimeout(this.searchTimer);
  }

  // Pedimos la lista de vuelos al servidor
  loadFlights(): void {
    this.tripService.getFlights().subscribe({
      next: (data) => {
        this.handleFlightData(data); // Si va bien, guardamos los vuelos
        this.clearLoadTimer();
      },
      error: (err) => {
        this.handleLoadError(err); // Si hay error, lo mostramos
        this.clearLoadTimer();
      }
    });
  }

  // Quitamos el temporizador de carga si ya no hace falta
  private clearLoadTimer(): void {
    if (this.loadTimer) {
      clearTimeout(this.loadTimer);
      this.isLoading = false;
    }
  }

  // Si hay error cargando los vuelos, lo mostramos y vaciamos las listas
  private handleLoadError(err: any): void {
    console.error('Error al cargar vuelos:', err);
    this.hasError = true;
    this.flights = [];
    this.filteredFlights = [];
    this.initialLoad = false;
  }

  // Cada 10 segundos, pedimos los vuelos al servidor para ver si hay cambios
  private startPolling(): void {
    this.pollingSubscription = timer(0, this.pollingInterval).pipe(
      takeWhile(() => this.isComponentAlive),
      switchMap(() => {
        if (!this.isLoading) this.isCheckingForUpdates = true;
        return this.tripService.getFlights();
      }),
      distinctUntilChanged((prev, curr) => 
        JSON.stringify(prev) === JSON.stringify(this.previousFlights)
      )
    ).subscribe({
      next: (data) => {
        const newFlights = data.map(flight => ({
          ...flight,
          companyLogoUrl: flight.company?.logo_url || 'assets/default-company-logo.png'
        }));
        
        if (this.haveFlightsChanged(newFlights)) {
          this.handleNewFlightsDetected(newFlights);
        }
        
        this.isCheckingForUpdates = false;
        this.lastUpdated = new Date();
      },
      error: (err) => {
        console.error('Error en actualización automática:', err);
        this.isCheckingForUpdates = false;
      }
    });
  }

  // Comprobamos si la lista de vuelos ha cambiado
  private haveFlightsChanged(newFlights: Flight[]): boolean {
    return JSON.stringify(newFlights) !== JSON.stringify(this.previousFlights);
  }

  // Si hay vuelos nuevos o se han quitado, mostramos un aviso durante 5 segundos
  private handleNewFlightsDetected(newFlights: Flight[]): void {
    const addedFlights = newFlights.filter(nf => 
      !this.previousFlights.some(pf => pf.id === nf.id)
    );
    
    const removedFlights = this.previousFlights.filter(pf => 
      !newFlights.some(nf => nf.id === pf.id)
    );

    if (addedFlights.length > 0 || removedFlights.length > 0) {
      this.showUpdateNotification = true;
      setTimeout(() => this.showUpdateNotification = false, 5000);
    }
    
    this.previousFlights = [...newFlights];
  }

  animationState = 'idle'; // Para animaciones de búsqueda

  // Cuando recibimos los vuelos, los guardamos y filtramos según la búsqueda
  private handleFlightData(data: Flight[]): void {
    this.flights = data.map(flight => ({
      ...flight,
      companyLogoUrl: flight.company?.logo_url || 'assets/default-company-logo.png'
    }));
    
    this.filterFlights(this.currentSearch);
    this.isLoading = false;
    this.showRefresh = this.flights.length === 0;
    this.lastUpdated = new Date();
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
    }, 3000);
  }

  // Cuando termina una animación, comprobamos si seguimos buscando
  onAnimationDone() {
    if (this.searching) {
      this.animationState = 'searching';
    }
  }

  // Comprueba si han cambiado los vuelos (añadidos o quitados)
  private checkForFlightChanges(newFlights: Flight[]): void {
    const currentIds = this.flights.map(f => f.id);
    const newIds = newFlights.map(f => f.id);
    
    const added = newFlights.filter(f => !currentIds.includes(f.id));
    const removed = this.flights.filter(f => !newIds.includes(f.id));

    if (added.length > 0 || removed.length > 0) {
      this.showUpdateNotification = true;
      setTimeout(() => this.showUpdateNotification = false, 5000);
    }
  }
}