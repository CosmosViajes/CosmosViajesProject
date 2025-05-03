import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ExperienciasService {
  private apiUrl = 'http://cosmoviajes.local/api/';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    ) {}

  getExperiencias(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}v1/experiencias`);
  }

  addExperiencia(data: any): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });
  
    return this.http.post(`${this.apiUrl}v1/experiencias`, data, { headers });
  }
  
  uploadImage(formData: FormData): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });
  
    return this.http.post(`${this.apiUrl}experiencias/image/upload`, formData, { headers });
  }
  
  deleteImage(id: number): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });
  
    return this.http.delete(`${this.apiUrl}experiencias/image/${id}/delete`, { headers });
  }  

  toggleLike(experienciaId: number, userId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}experiencias/${experienciaId}/like/${userId}`, {});
  }
  
  getUserLikes(): Observable<number[]> {
    return this.http.get<number[]>(`${this.apiUrl}experiencias/user-likes`);
  }

  deleteExperiencia(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}experiencias/${id}/destroy`);
  }
}