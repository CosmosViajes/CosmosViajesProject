import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private readonly API = 'https://cosmosviajesbackend.onrender.com/api';

  constructor(private http: HttpClient) { }

  getCompanies() {
    return this.http.get<any[]>(`${this.API}/companies`);
  }
}