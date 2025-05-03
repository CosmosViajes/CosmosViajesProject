import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import Swal from 'sweetalert2';

interface AuthStatus {
  isAuthenticated: boolean;
  userData?: {
    id?: number;
    name?: string;
    email?: string;
    photo?: string;
    role?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://cosmoviajes.local/api';
  public authStatus$ = new BehaviorSubject<AuthStatus>({ isAuthenticated: false });
  public reservedTrips$ = new BehaviorSubject<any[]>([]);

  constructor(
    private http: HttpClient,
    private jwtHelper: JwtHelperService,
    private router: Router
  ) {
    this.checkToken();
  }

  /**
   * Verifica si hay un token válido en localStorage y actualiza el estado global.
   */
  private checkToken(): void {
    const token = localStorage.getItem('token');
    if (token && !this.jwtHelper.isTokenExpired(token)) {
      const decodedToken = this.jwtHelper.decodeToken(token);
      
      // Depuración: Verifica el token decodificado
      console.log('Token decodificado:', decodedToken);
  
      this.authStatus$.next({
        isAuthenticated: true,
        userData: {
          id: decodedToken.id,
          name: decodedToken.name,
          email: decodedToken.email,
          photo: decodedToken.photo,
          role: decodedToken.role,
        },
      });
  
      this.updateUserId();
    } else {
      this.authStatus$.next({ isAuthenticated: false });
    }
  }    

  getToken() {
    return localStorage.getItem('token');
  }

  /**
   * Muestra una alerta de éxito.
   */
  showSuccessAlert(title: string, message: string): void {
    Swal.fire({
      title: title,
      text: message,
      icon: 'success',
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'Aceptar',
    });
  }

  /**
   * Muestra una alerta de error.
   */
  showErrorAlert(message: string): void {
    Swal.fire({
      title: 'Error',
      text: message,
      icon: 'error',
      confirmButtonColor: '#d33',
      confirmButtonText: 'Entendido',
    });
  }

  /**
   * Inicia sesión y actualiza el estado global con los datos del usuario.
   */
  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        const token = response.token;
        localStorage.setItem('token', token);
        const decodedToken = this.jwtHelper.decodeToken(token);
  
        const userData = {
          id: decodedToken.id,
          name: decodedToken.name,
          email: decodedToken.email,
          photo: decodedToken.photo,
          role: decodedToken.role,
        };
  
        this.authStatus$.next({
          isAuthenticated: true,
          userData,
        });
  
        this.showSuccessAlert('¡Bienvenido!', 'Has iniciado sesión correctamente');
        this.router.navigate(['/']);
      }),
      catchError((error) => {
        let errorMessage = 'Error al iniciar sesión';

        if (error.status === 404) {
          errorMessage = 'El correo electrónico no está registrado';
        } else if (error.status === 401) {
          errorMessage = 'La contraseña es incorrecta';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }

        this.showErrorAlert(errorMessage);
        return throwError(error);
      })
    );
  }

  /**
   * Registra un nuevo usuario.
   */
  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData).pipe(
      switchMap((response: any) => {
        // Verificar si el backend devuelve el token directamente
        if (response.token) {
          localStorage.setItem('token', response.token);
          this.checkToken(); // Actualizar estado de autenticación
          return of(response); // Devolver respuesta completa
        }
        // Si no hay token, hacer login explícito
        return this.login({ 
          email: userData.email, 
          password: userData.password 
        });
      }),
      tap(() => {
        this.showSuccessAlert('¡Registro exitoso!', 'Bienvenido/a');
        this.router.navigate(['/']);
      }),
      catchError((error) => {
        // Manejo mejorado de errores
        let errorMessage = 'Error en el registro: ';
        if (error.error?.message) {
          errorMessage += error.error.message;
        } else if (error.status === 500) {
          errorMessage += 'Error interno del servidor';
        }
        this.showErrorAlert(errorMessage);
        return throwError(() => error);
      })
    );
  }

  /**
   * Cierra sesión y limpia el estado global.
   */
  logout(): void {
    localStorage.removeItem('userData');
    localStorage.removeItem('token'); // Elimina el token del almacenamiento local
    this.authStatus$.next({
      isAuthenticated: false,
      userData: undefined, // Limpia todos los datos del usuario
    });
    this.router.navigate(['/']); // Redirige al usuario después de cerrar sesión
  }

  /**
   * Obtiene el ID del usuario autenticado por su email decodificado desde el JWT.
   */
  updateUserId(): void {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No hay token disponible');
    
    const decodedToken = this.jwtHelper.decodeToken(token);
    const userEmail = decodedToken.email;
  
    this.http.post<{ user_id: number }>(`${this.apiUrl}/user-by-email`, { email: userEmail })
      .subscribe({
        next: (response) => {
          const currentStatus = this.authStatus$.getValue();
          
          this.authStatus$.next({
            ...currentStatus,
            userData: {
              ...currentStatus.userData,
              id: response.user_id,
            },
          });
        },
        error: (error) => console.error('Error obteniendo ID:', error)
      });
  }  

  uploadPhoto(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/profile/photo`, formData);
  }

  getProfilePhoto(userId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/users/${userId}/get-photo`, { responseType: 'blob' });
  }

  getReservedTrips(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users/${userId}/reserved-trips`).pipe(
      tap((trips) => {
        this.reservedTrips$.next(trips); // Actualiza el estado global con las reservas cargadas
      }),
      catchError((error) => {
        console.error('Error al cargar los viajes reservados:', error);
        return throwError(error);
      })
    );
  }

  addReservation(reservationData: { user_id: number; trip_id: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/reserved-trips`, reservationData).pipe(
      tap(() => {
        // Recargar las reservas después de agregar una nueva
        this.getReservedTrips(reservationData.user_id).subscribe();
      }),
      catchError((error) => {
        console.error('Error al agregar la reserva:', error);
        return throwError(error);
      })
    );
  }

  cancelReservation(userId: number, reservationId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${userId}/reserved-trips/${reservationId}`).pipe(
      tap(() => {
        // Recargar las reservas después de cancelar una
        this.getReservedTrips(userId).subscribe();
      }),
      catchError((error) => {
        console.error('Error al cancelar la reserva:', error);
        return throwError(error);
      })
    );
  }

  getCurrentUser(): Observable<any> {
    return this.http.get(`${this.apiUrl}/user`).pipe(
      catchError(error => {
        console.error('Error al obtener usuario:', error);
        return throwError(() => error);
      })
    );
  }

  updateAuthStatus(newStatus: { isAuthenticated: boolean; userData?: any }): void {
    this.authStatus$.next(newStatus);
    localStorage.setItem('authStatus', JSON.stringify(newStatus)); // Guardar estado completo
  }

  updateUser(userId: number, formData: FormData): Observable<any> {
    // Mostrar todos los datos del FormData
    console.log('------ DATOS QUE SE ENVIARÁN ------');
    console.log('Endpoint:', `${this.apiUrl}/users/${userId}/update`);

    // Iterar sobre todas las entradas del FormData
    formData.forEach((value, key) => {
      if (value instanceof File) {
        console.log(`${key}:`, `Archivo (Nombre: ${value.name}, Tipo: ${value.type}, Tamaño: ${(value.size / 1024).toFixed(2)} KB)`);
      } else {
        console.log(`${key}:`, value);
      }
    });

    console.log('-----------------------------------');

    return this.http.post(`${this.apiUrl}/users/${userId}/update`, formData);
  }

  isCompany(): boolean {
    return this.authStatus$.value.userData?.role === 'company';
  }
  
  isProvider(): boolean {
    return this.authStatus$.value.userData?.role === 'provider';
  }
  
  isAdmin(): boolean {
    return this.authStatus$.value.userData?.role === 'admin';
  }

  submitRoleRequest(userId: number, roleType: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/requests`, {
      user_id: userId,
      type: roleType,
      description: 'Solicitud de cambio de rol'
    });
  }
  
  updateUserRole(userId: number, newRole: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${userId}/role`, { role: newRole });
  }  

}