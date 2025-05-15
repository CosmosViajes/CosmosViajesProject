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
  credentials: { [key: string]: string } = {
    email: '',
    password: ''
  };

  loading = signal(false);
  error = signal('');

  constructor(
    public authService: AuthService,
    private router: Router,
    private dialogRef: MatDialogRef<LoginDialogComponent>,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    const emailFromState = this.router.getCurrentNavigation()?.extras.state?.['email'];
    if (emailFromState) {
      this.credentials['email'] = emailFromState;
    }
  }

  onSubmit() {
    this.loading.set(true);
    this.error.set('');

    this.authService.login({
      email: this.credentials['email'],
      password: this.credentials['password']
    }).subscribe({
      next: () => {
        this.dialogRef.close(true);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.error.set(this.getErrorMessage(err));
        this.loading.set(false);
      },
      complete: () => {
        this.loading.set(false);
      }
    });
  }

  /**
   * Abre el diálogo de registro y cierra el diálogo actual.
   */
  openRegister(): void {
    this.dialogRef.close(); // Cierra el diálogo de inicio de sesión
    this.dialog.open(RegisterDialogComponent, {
      width: '60vw', // Ajusta el ancho del diálogo (60% del ancho de la ventana)
      height: 'auto', // Ajusta la altura automáticamente según el contenido
      panelClass: 'custom-dialog-container', // Aplica una clase personalizada
      backdropClass: 'custom-backdrop', // Clase personalizada para el fondo
    });
  }

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