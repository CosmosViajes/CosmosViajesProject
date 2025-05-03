import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlightCardComponent } from '../flight-card/flight-card.component';
import { SearchBarComponent } from '../search-bar/search-bar.component';
import { MatIconModule } from '@angular/material/icon';
import { TripService } from '../../services/trip.service';
import { Flight } from '../../models/flight.model';

@Component({
  selector: 'app-flights-list',
  standalone: true,
  imports: [CommonModule, FlightCardComponent, SearchBarComponent, MatIconModule],
  template: `
<section class="flights-container bg-[#04040a] py-10 w-full min-h-screen relative overflow-hidden">
  <!-- Estrellas dinámicas -->
  <div class="stars absolute top-0 left-0 w-full h-full z-[1]">
    <div
      *ngFor="let star of starsArray"
      class="dynamic-star"
      [style.top]="star.top"
      [style.left]="star.left"
      [style.opacity]="star.opacity"
    ></div>
  </div>

  <!-- Parte Superior -->
  <div class="top-section relative w-full h-[20%] z-[20]">
    <!-- Luna -->
    <div class="moon absolute top-0 left-0 w-full">
      <div class="moon-circle absolute rounded-full bg-gray-400"
        style="
          transform: translate(-50%, 50%);
          clip: rect(auto, auto, auto, 0px);
          width: 20%;
          height: 40vh;
          bottom: 50px;
          left: 0%;
        ">
      </div>
    </div>

    <!-- Título -->
    <h2 class="section-title text-4xl font-extrabold text-center text-yellow-400 mb-4">
      PRÓXIMOS VUELOS DISPONIBLES
    </h2>

    <!-- Buscador -->
    <div class="search-section relative max-w-4xl mx-auto">
      <app-search-bar (searchChange)="filterFlights($event)"></app-search-bar>
    </div>
  </div>

  <!-- Parte Central -->
  <div class="middle-section relative w-full h-[60%] z-[30]">
    <!-- Listado de vuelos -->
    <div class="flights-list flex flex-col gap-4 px-8 w-full">
      <ng-container *ngIf="filteredFlights.length > 0; else noResults">
        <app-flight-card
          *ngFor="let flight of filteredFlights"
          [flight]="flight"
          class="w-full"
        ></app-flight-card>
      </ng-container>

      <ng-template #noResults>
        <div class="no-results flex flex-col items-center justify-center text-center text-yellow-400 col-span-full">
          <mat-icon class="text-yellow-500 text-7xl mb-6">search_off</mat-icon>
          <p class="text-2xl font-medium text-gray-300">No se encontraron vuelos que coincidan con "{{ currentSearch }}"</p>
        </div>
      </ng-template>
    </div>
  </div>

  <!-- Parte Inferior -->
  <div class="bottom-section relative w-full h-[150px] z-[20]">
    <!-- Tierra -->
    <div class="earth absolute bottom-0 left-0 w-full">
      <div class="earth-circle absolute rounded-full bg-green-500"
        style="
          margin-top: 10px;
          transform: translate(-50%, 50%);
          clip: rect(auto, auto, auto, 0px);
          width: 20%;
          height: 40vh;
          top: -300px;
          left: 100%;
        ">
      </div>
    </div>
  </div>

  <!-- Cohete -->
  <div
    class="rocket absolute"
    [ngStyle]="{
      top: rocketPosition.top,
      left: rocketPosition.left,
      transform: 'scale(' + rocketScale + ') rotate(' + rocketRotation + 'deg)',
      opacity: rocketOpacity,
      zIndex: rocketZIndex
    }"
  >
    <img src="assets/rocket.png" alt="Cohete" class="w-[50px] h-auto" />
  </div>
</section>
`,
  styles: [`

section {
  height: 100vh;
}

.flights-container {
  position: relative;
  overflow: hidden;
}

.moon {
  position: absolute;
}

.moon-circle {
  position: absolute;
  border-radius: 50%;
}

.earth {
  position: absolute;
}

.earth-circle {
  position: absolute;
}

.clouds {
  position: absolute;
}

.stars {
  position: absolute;
}

.dynamic-star {
  position: absolute;
  width: 3px; /* Tamaño visible */
  height: 3px; /* Tamaño visible */
  background-color:rgba(252, 242, 100, 0.99); /* Color blanco brillante */
}

.rocket {
  transition:
    top 60s linear,
    left 60s linear,
    transform 50s linear,
    opacity 60s linear;
  transform-origin: center; /* Para que la rotación sea desde el centro */
}
`],
})
export class FlightsListComponent implements OnInit {
  starsArray: { top: string; left: string; opacity: number; transition: boolean }[] = [];

  moonSizePercentage = "30%"; 
  earthSizePercentage = "30%"; 

  // Propiedades del cohete
  rocketPosition = { top: '100%', left: '100%' }; // Posición inicial (abajo derecha)
  rocketScale = 1; // Tamaño inicial del cohete
  rocketOpacity = 1; // Opacidad inicial del cohete
  rocketZIndex = 10; // Z-index del cohete para superposición
  rocketRotation = -45;

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

  ngOnInit(): void {
    this.loadFlights();
    this.generateStars();

    setInterval(() => {
      this.updateRandomStars();
    }, Math.random() * (1000 - 500) + 500);

    this.startRocketAnimation();
  }

  startRocketAnimation(): void {
    let goingUp = true;

    const animate = () => {
      if (goingUp) {
        // Animación de abajo derecha a arriba izquierda
        this.rocketRotation = 135;
        this.rocketPosition = { top: '0%', left: '0%' };
        setTimeout(() => {
        }, 60000); // Reducir tamaño antes de llegar (2 segundos después de empezar)
      } else {
        // Animación de arriba izquierda a abajo derecha
        this.rocketRotation = -45;
        this.rocketPosition = { top: '100%', left: '100%' };
        setTimeout(() => {
        }, 60000); // Reducir tamaño antes de llegar (2 segundos después de empezar)
      }

      setTimeout(() => {
        goingUp = !goingUp; // Cambiar dirección
        this.rocketScale = 1; // Restaurar tamaño
        this.rocketOpacity = 1; // Restaurar opacidad

        if (goingUp) {
          this.rocketPosition = { top: '100%', left: '100%' }; // Reiniciar posición inicial
        } else {
          this.rocketPosition = { top: '0%', left: '0%' }; // Reiniciar posición inicial inversa
        }
      }, 120000); // Esperar a que termine la animación actual

      setTimeout(animate, goingUp ? 120000 : 120000); // Esperar antes de iniciar la siguiente animación
    };

    animate();
  }

  flights: Flight[] = [];
  filteredFlights: Flight[] = [];
  currentSearch = '';

  constructor(private tripService: TripService) {}

  loadFlights(): void {
    this.tripService.getFlights().subscribe({
      next: (data) => {
        this.flights = data.map((flight) => ({
          ...flight,
          companyLogoUrl:
            flight.company?.logo_url || 'assets/default-company-logo.png',
        }));
        this.filteredFlights = this.flights;
      },
      error: (err) => {
        console.error('Error al cargar los vuelos:', err);
      },
    });
  }

  filterFlights(searchTerm: string): void {
    this.currentSearch = searchTerm.toLowerCase();
    if (!searchTerm) {
      this.filteredFlights = this.flights;
      return;
    }

    this.filteredFlights = this.flights.filter((flight) =>
      (flight.name?.toLowerCase() || '').includes(this.currentSearch) ||
      (flight.company?.name?.toLowerCase() || '').includes(this.currentSearch) ||
      (flight.type?.toLowerCase() || '').includes(this.currentSearch) ||
      (new Date(flight.departure).toLocaleDateString('es-ES') || '').includes(this.currentSearch) ||
      (flight.duration?.toString() || '').includes(this.currentSearch)
    );
  }
}