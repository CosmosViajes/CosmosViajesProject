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
  providers: any[] = [];
  loading = true;

  constructor(private providerService: ProviderService) {}

  ngOnInit() {
    this.providerService.getProviders().subscribe({
      next: (data) => {
        this.providers = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }
}