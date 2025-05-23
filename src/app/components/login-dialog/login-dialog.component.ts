import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog'; // Importar MatDialog
import { MatButtonModule } from '@angular/material/button';
import { RegisterDialogComponent } from '../register-dialog/register-dialog.component'; // Importar RegisterDialogComponent

@Component({
  selector: 'app-login-dialog',
  standalone: true,
  imports: [FormsModule, CommonModule, MatButtonModule, MatDialogModule],
  template: `
    <div class="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 class="text-2xl font-bold mb-6 text-center">Iniciar sesión</h2>
      
      <form (ngSubmit)="onSubmit()" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">Email</label>
          <input type="email" [(ngModel)]="credentials['email']" name="email" required
                class="w-full px-3 py-2 border rounded-md">
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Contraseña</label>
          <input type="password" [(ngModel)]="credentials['password']" name="password" required
                class="w-full px-3 py-2 border rounded-md">
        </div>

        <div *ngIf="error()" class="text-red-500 text-sm">
          {{ error() }}
        </div>

        <button type="submit" [disabled]="loading()"
                class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
          {{ loading() ? 'Iniciando sesión...' : 'Iniciar sesión' }}
        </button>
      </form>

      <div class="mt-4 text-center text-sm">
        ¿No tienes cuenta? 
        <a (click)="openRegister()" class="text-blue-600 hover:underline cursor-pointer">Regístrate</a>
      </div>
    </div>
  `,
})
export class LoginDialogComponent implements OnInit {
  // Aquí guardamos el email y la contraseña que escribe el usuario
  credentials: { [key: string]: string } = {
    email: '',
    password: ''
  };

  loading = signal(false); // Esto es true mientras intentamos iniciar sesión
  error = signal(''); // Aquí guardamos el mensaje de error si algo sale mal

  constructor(
    public authService: AuthService, // Servicio para iniciar sesión
    private router: Router, // Para movernos a otra página si hace falta
    private dialogRef: MatDialogRef<LoginDialogComponent>, // Para cerrar la ventana de login
    private dialog: MatDialog // Para abrir otras ventanas, como la de registro
  ) {}

  // Cuando se abre la ventana de login
  ngOnInit() {
    // Si venías de otra parte de la web y ya pusiste un email, lo rellenamos aquí
    const emailFromState = this.router.getCurrentNavigation()?.extras.state?.['email'];
    if (emailFromState) {
      this.credentials['email'] = emailFromState;
    }
  }

  // Cuando pulsas el botón de iniciar sesión
  onSubmit() {
    this.loading.set(true); // Ponemos el "cargando"
    this.error.set(''); // Quitamos mensajes de error viejos

    // Llamamos al servicio para intentar iniciar sesión con el email y la contraseña
    this.authService.login({
      email: this.credentials['email'],
      password: this.credentials['password']
    }).subscribe({
      next: () => {
        // Si todo va bien, cerramos la ventana y vamos a la página principal
        this.dialogRef.close(true);
        this.router.navigate(['/']);
      },
      error: (err) => {
        // Si hay error, mostramos un mensaje claro
        this.error.set(this.getErrorMessage(err));
        this.loading.set(false);
      },
      complete: () => {
        this.loading.set(false); // Quitamos el "cargando" cuando termina
      }
    });
  }

  // Si el usuario quiere registrarse, abrimos la ventana de registro y cerramos esta
  openRegister(): void {
    this.dialogRef.close(); // Cerramos la ventana de login
    this.dialog.open(RegisterDialogComponent, {
      width: '60vw', // Ancho de la ventana
      height: 'auto', // Altura automática
      panelClass: 'custom-dialog-container', // Clase personalizada para estilos
      backdropClass: 'custom-backdrop', // Fondo personalizado
    });
  }

  // Esta función pone un mensaje de error claro según lo que haya pasado
  private getErrorMessage(error: any): string {
    if (error.status === 401) {
      return 'Email o contraseña incorrectos';
    }
    if (error.error?.['message']) {
      return error.error['message'];
    }
    return 'Error al iniciar sesión. Inténtalo de nuevo más tarde';
  }
}