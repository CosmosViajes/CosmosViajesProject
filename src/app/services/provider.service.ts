import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ProviderService {
  private readonly API = 'https://cosmosviajesbackend.onrender.com/api';

  constructor(private http: HttpClient) { }

  getProviders() {
    return this.http.get<any[]>(`${this.API}/providers`);
  }
}