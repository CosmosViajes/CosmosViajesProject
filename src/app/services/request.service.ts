import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class RequestService {
  private apiUrl = 'https://cosmosviajesbackend.onrender.com/api';

  constructor(private http: HttpClient) {}

  submitRequest(requestData: { user_id: number; type: string; description?: string }) {
    return this.http.post(`${this.apiUrl}/requests`, requestData);
  }

  getRequests() {
    return this.http.get<any[]>(`${this.apiUrl}/admin/requests`);
  }

  updateRequest(id: number, status: string) {
    return this.http.put(`${this.apiUrl}/admin/requests/${id}`, { status });
  }
  
}