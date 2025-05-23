import { Component } from '@angular/core';
import { ProviderService } from '../../services/provider.service';
import { FlightListModalComponent } from '../flight-list-modal/flight-list-modal.component';

@Component({
  selector: 'app-provider-list',
  templateUrl: './provider-list.component.html',
  styleUrl: './provider-list.component.css',
  imports: [
    FlightListModalComponent
  ]
})
export class ProviderListComponent {
  providers: any[] = []; // Aquí vamos a guardar la lista de proveedores (empresas que ofrecen viajes)
  loading = true; // Esto es true mientras estamos cargando los datos

  constructor(private providerService: ProviderService) {}

  // Cuando se abre la página, pedimos la lista de proveedores al servidor
  ngOnInit() {
    this.providerService.getProviders().subscribe({
      next: (data) => {
        this.providers = data; // Guardamos la lista de proveedores
        this.loading = false;  // Ya hemos terminado de cargar
      },
      error: () => this.loading = false // Si hay error, dejamos de cargar
    });
  }
}