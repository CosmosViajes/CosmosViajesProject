import { Component, OnDestroy } from '@angular/core';
import { ProviderService } from '../../services/provider.service';
import { CompanyService } from '../../services/company.service';
import { FlightListModalComponent } from '../flight-list-modal/flight-list-modal.component';

@Component({
  selector: 'app-provider-list',
  templateUrl: './provider-list.component.html',
  styleUrl: './provider-list.component.css',
  imports: [FlightListModalComponent]
})
export class ProviderListComponent implements OnDestroy {
  providers: any[] = [];
  companies: any[] = [];
  loading = true;

  showNoProvidersMessage = false;
  showNoCompaniesMessage = false;
  private noProvidersTimer: any;
  private noCompaniesTimer: any;

  constructor(
    private providerService: ProviderService,
    private companyService: CompanyService
  ) {}

  ngOnInit() {
    this.loadProviders();
    this.loadCompanies();
  }

  ngOnDestroy() {
    this.clearTimers();
  }

  private loadProviders(): void {
    this.providerService.getProviders().subscribe({
      next: (data) => {
        this.providers = data;
        this.checkLoadingState();
        this.manageProvidersMessage();
      },
      error: () => {
        this.loading = false;
        this.manageProvidersMessage();
      }
    });
  }

  private loadCompanies(): void {
    this.companyService.getCompanies().subscribe({
      next: (data) => {
        this.companies = data;
        this.checkLoadingState();
        this.manageCompaniesMessage();
      },
      error: () => {
        this.loading = false;
        this.manageCompaniesMessage();
      }
    });
  }

  private checkLoadingState(): void {
    if (this.providers.length > 0 || this.companies.length > 0) {
      this.loading = false;
    }
  }

  private manageProvidersMessage(): void {
    if (this.providers.length === 0) {
      this.clearTimer('providers');
      this.noProvidersTimer = setTimeout(() => {
        this.showNoProvidersMessage = true;
      }, 2500);
    } else {
      this.showNoProvidersMessage = false;
      this.clearTimer('providers');
    }
  }

  private manageCompaniesMessage(): void {
    if (this.companies.length === 0) {
      this.clearTimer('companies');
      this.noCompaniesTimer = setTimeout(() => {
        this.showNoCompaniesMessage = true;
      }, 2500);
    } else {
      this.showNoCompaniesMessage = false;
      this.clearTimer('companies');
    }
  }

  private clearTimer(type: 'providers' | 'companies'): void {
    if (type === 'providers' && this.noProvidersTimer) {
      clearTimeout(this.noProvidersTimer);
      this.noProvidersTimer = null;
    }
    if (type === 'companies' && this.noCompaniesTimer) {
      clearTimeout(this.noCompaniesTimer);
      this.noCompaniesTimer = null;
    }
  }

  private clearTimers(): void {
    this.clearTimer('providers');
    this.clearTimer('companies');
  }
}