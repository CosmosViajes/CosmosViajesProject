import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { LoginDialogComponent } from '../login-dialog/login-dialog.component';

interface UserFormData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: 'user' | 'company' | 'provider';
}

@Component({
  selector: 'app-register-dialog',
  standalone: true,
  imports: [FormsModule, CommonModule, MatDialogModule],
  template: `
  <div class="max-w-md mx-auto p-8 bg-white rounded-lg shadow-md">
  <h2 class="text-3xl font-bold text-gray-800 mb-6 text-center">Registro</h2>

  <!-- Formulario -->
  <form (ngSubmit)="onSubmit()" class="space-y-6">
    <!-- Campos comunes -->
    <div class="space-y-2">
      <label class="block text-sm font-medium text-gray-700">
        Nombre completo
      </label>
      <input 
        type="text" 
        [ngModel]="userData().name"
        (ngModelChange)="updateUserData('name', $event)"
        name="name" 
        required
        class="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-300"
        placeholder="Tu nombre completo">
    </div>

    <div class="space-y-2">
      <label class="block text-sm font-medium text-gray-700">Email</label>
      <input 
        type="email" 
        [ngModel]="userData().email"
        (ngModelChange)="updateUserData('email', $event)"
        name="email" 
        required
        class="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-300"
        placeholder="tu@email.com">
    </div>

    <div class="space-y-2">
      <label class="block text-sm font-medium text-gray-700">Contraseña</label>
      <input 
        type="password" 
        [ngModel]="userData().password"
        (ngModelChange)="updateUserData('password', $event)"
        name="password" 
        required
        class="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-300"
        placeholder="••••••••">
    </div>

    <div class="space-y-2">
      <label class="block text-sm font-medium text-gray-700">Confirmar contraseña</label>
      <input 
        type="password"
        [ngModel]="userData().password_confirmation"
        (ngModelChange)="updateUserData('password_confirmation', $event)"
        name="password_confirmation"
        required
        class="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-300"
        placeholder="••••••••">
    </div>

    <button 
      type="submit" 
      [disabled]="loading()"
      class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed transition duration-300">
      {{ loading() ? 'Registrando...' : 'Crear cuenta' }}
    </button>

    <div class="flex items-center justify-center mt-4">
      <span class="text-sm text-gray-600">¿Ya tienes cuenta?</span>
      <a 
        (click)="openLoginDialog()"
        class="ml-1 text-sm font-medium text-blue-600 hover:text-blue-500 hover:underline transition duration-300 cursor-pointer">
        Inicia sesión
      </a>
    </div>
  </form>
</div>
  `,
  styles: []
})
export class RegisterDialogComponent {
  // Esto sirve para cerrar la ventana de registro y para abrir otras ventanas
  private dialogRef = inject(MatDialogRef);
  private dialog = inject(MatDialog);

  // Aquí guardamos los datos que el usuario va escribiendo en el formulario
  userData = signal<UserFormData>({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'user' // Por defecto, el usuario es normal
  });

  loading = signal(false); // Esto es true mientras estamos registrando
  error = signal(''); // Aquí guardamos el mensaje de error si algo sale mal
  activeTab: 'user' | 'company' = 'user'; // Para saber si el usuario quiere registrarse como persona o como empresa

  constructor(
    private authService: AuthService, // Servicio para registrar y loguear usuarios
    private router: Router // Para movernos a otra página si hace falta
  ) {}

  // Esta función actualiza los datos del usuario cuando escribe en el formulario
  updateUserData(field: keyof UserFormData, value: string) {
    this.userData.update(data => ({
      ...data,
      [field]: value
    }));
  }

  // Cambia entre pestaña de usuario normal y empresa
  setActiveTab(tab: 'user' | 'company') {
    this.activeTab = tab;
    const newRole = tab === 'user' ? 'user' : 'company';
    this.updateUserData('role', newRole);
  }

  // Cuando el usuario pulsa el botón de registrarse
  onSubmit() {
    this.loading.set(true);
    const currentData = this.userData();
  
    // Si las contraseñas no coinciden, mostramos un error
    if (currentData.password !== currentData.password_confirmation) {
      this.error.set('Las contraseñas no coinciden');
      this.loading.set(false);
      return;
    }
  
    // Llamamos al servicio para registrar el usuario
    this.authService.register(currentData).subscribe({
      next: (response) => {
        if (response.token) {
          // Si todo va bien, guardamos los datos y cerramos la ventana
          this.authService.authStatus$.next({
            isAuthenticated: true,
            userData: {
              id: response.user.id,
              name: response.user.name,
              email: response.user.email,
              role: response.user.role
            }
          });
          this.dialogRef.close(true);
          this.router.navigate(['/']);
        } else {
          // Si no devuelve token, intentamos hacer login manualmente
          this.authService.login({
            email: currentData.email,
            password: currentData.password
          }).subscribe({
            next: () => {
              this.dialogRef.close(true);
              this.router.navigate(['/']);
            },
            error: (err) => this.handleLoginError(err)
          });
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.handleRegistrationError(err);
      }
    });
  }
  
  // Si hay error al iniciar sesión después de registrarse, mostramos un mensaje
  private handleLoginError(err: any) {
    this.loading.set(false);
    this.error.set('Error al iniciar sesión automáticamente');
  }  

  // Si hay error al registrar, mostramos un mensaje claro
  private handleRegistrationError(err: any) {
    if (err.error?.errors?.email) {
      this.error.set('El email ya está registrado');
    } else {
      this.error.set('Error al registrar. Inténtalo de nuevo');
    }
  }

  // Si el usuario quiere ir a la ventana de login, la abrimos y cerramos esta
  openLoginDialog(): void {
    this.dialogRef.close();
    this.dialog.open(LoginDialogComponent, {
      width: '60vw',
      panelClass: 'custom-dialog-container',
      backdropClass: 'custom-backdrop',
    });
  }
}