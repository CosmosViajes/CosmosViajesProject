import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StatsService {
  private apiUrl = 'http://cosmoviajes.local/api/stats';

  constructor(private http: HttpClient) {}

  getStats(period: string): Observable<any> {
    const params = new HttpParams().set('period', period);
    return this.http.get(this.apiUrl, { params });
  }

  getAdvancedStats(params: any): Observable<any> {
    let httpParams = new HttpParams().set('period', params.period);
  
    // Convertir a ISO string solo si el valor es Date
    if (params.date instanceof Date) {
      httpParams = httpParams.set('date', params.date.toISOString());
    }
    
    if (params.month instanceof Date) {
      httpParams = httpParams.set('month', params.month.toISOString());
    }
    
    if (params.year) {
      httpParams = httpParams.set('year', params.year.toString());
    }
  
    return this.http.get(`${this.apiUrl}/advanced-stats`, { params: httpParams });
  }
    
}
