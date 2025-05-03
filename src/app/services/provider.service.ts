import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ProviderService {
  private readonly API = 'http://cosmoviajes.local/api';

  constructor(private http: HttpClient) { }

  getProviders() {
    return this.http.get<any[]>(`${this.API}/providers`);
  }
}