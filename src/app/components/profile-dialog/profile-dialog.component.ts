import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';
import { RequestService } from '../../services/request.service';

@Component({
    selector: 'app-profile-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="profile-container bg-white rounded-2xl shadow-2xl p-10 max-w-2xl min-h-[600px] mx-auto">
      <h2 class="text-3xl font-bold text-gray-800 mb-8 text-center">Perfil del Usuario</h2>

      <button
            type="button"
            (click)="closeDialog()"
            class="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-8 rounded-lg transition duration-200"
            style="position: absolute; top: 1%; right: 2%;"
          >
            Cerrar
      </button>

      <div class="flex flex-col items-center mb-8 relative group">
        <img
          [src]="photo ? photo : 'https://ui-avatars.com/api/?name=' + (name || 'Usuario') + '&background=random&size=128'"
          alt="Foto de perfil"
          class="w-36 h-36 rounded-full object-cover border-4 border-blue-300 shadow-lg cursor-pointer"
          (click)="triggerFileInput()"
        >
        <div
          class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
          (click)="triggerFileInput()"
          style="width: 9rem; height: 9rem;"
        >
          <span class="text-white text-lg font-semibold">Editar</span>
        </div>
        <input
          type="file"
          #fileInput
          (change)="onFileSelected($event)"
          class="hidden"
        >
      </div>

      <form (ngSubmit)="updateUser()" class="space-y-6 max-w-lg mx-auto">
        <div>
          <label class="block text-base font-medium text-gray-700 mb-1">Nombre</label>
          <input
            type="text"
            [(ngModel)]="name"
            name="name"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg text-lg"
          >
        </div>

        <div>
          <label class="block text-base font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            [(ngModel)]="email"
            name="email"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg text-lg"
          >
        </div>

        <div class="flex flex-col items-center gap-4 mt-6">
          <button type="submit" class="bg-blue-600 text-white py-2 px-8 rounded-lg text-lg font-semibold hover:bg-blue-700 transition duration-200">
            Guardar Cambios
          </button>
        </div>
      </form>

      <!-- Opción para solicitar cambio de rol -->
      <div class="p-6 bg-blue-50 rounded-xl border border-blue-200 max-w-lg mx-auto" style="margin-top: 10px;">
        <h3 class="text-lg font-semibold text-blue-800 mb-2">¿Quieres un cambio de rol?</h3>
        <p class="mb-3 text-blue-800">Puedes pedir ser Empresa o Proveedor. Tu solicitud será revisada por un administrador.</p>
        <div class="flex flex-col md:flex-row gap-3">
          <button style="width: 50%;" class="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-md font-semibold"(click)="requestRole('company')">Empresa</button>
          <button style="width: 50%;" class="bg-purple-600 hover:bg-purple-700 text-white py-2 px-6 rounded-md font-semibold"(click)="requestRole('provider')">Proveedor</button>
        </div>
      </div>
    </div>
  `,
})
export class ProfileDialogComponent implements OnInit {
    selectedFile: File | null = null;
    previewUrl: string | ArrayBuffer | null = null;
    photo!: string;
    userId!: number;
    name!: string;
    email!: string;
    originalUserData: any = {};
    loading: boolean = false;
    hasChanges: boolean = false;

    pendingRelogin: boolean = false;
    storedCredentials: { email: string; password: string } | null = null;

    constructor(
        private authService: AuthService,
        private requestService: RequestService,
        private dialogRef: MatDialogRef<ProfileDialogComponent>
    ) { }

    ngOnInit(): void {
        this.loadUserData();
    }

    private loadUserData(): void {
        const authStatus = this.authService.authStatus$.getValue();
        const userData = authStatus.userData || JSON.parse(localStorage.getItem('userData') || '{}');

        if (userData?.id) {
            this.userId = userData.id;
            this.name = userData.name;
            this.email = userData.email;
            this.photo = userData.photo || this.generateAvatarUrl(userData.name);

            // Almacenar copia profunda de los datos originales
            this.originalUserData = JSON.parse(JSON.stringify({
                name: userData.name,
                email: userData.email,
                photo: userData.photo
            }));
        }
    }

    private generateAvatarUrl(name: string): string {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Usuario')}&background=random&size=128`;
    }

    triggerFileInput(): void {
        const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
        fileInput?.click();
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files?.length) {
            this.selectedFile = input.files[0];
            const reader = new FileReader();
            reader.onload = () => {
                this.previewUrl = reader.result;
                this.photo = reader.result as string;
                this.checkChanges();
            };
            reader.readAsDataURL(this.selectedFile);
        }
    }

    // Verificación de cambios mejorada
    checkChanges(): void {
        const nameChanged = this.name !== this.originalUserData.name;
        const emailChanged = this.email !== this.originalUserData.email;
        const photoChanged = !!this.selectedFile;

        this.hasChanges = nameChanged || emailChanged || photoChanged;
    }

    updateUser(): void {
        this.checkChanges();

        if (!this.hasChanges) {
            Swal.fire('Info', 'No se detectaron cambios', 'info');
            return;
        }

        // Paso 1: Solicitar contraseña antes de actualizar
        this.requestPassword().then((password) => {
            if (!password) return;

            this.loading = true;
            const formData = new FormData();

            // Agregar todos los campos (no solo los modificados)
            formData.append('name', this.name);
            formData.append('email', this.email);
            if (this.selectedFile) formData.append('photo', this.selectedFile);

            // Almacenar credenciales para reconexión, utiliza el nuevo email si se ha cambiado
            const newEmail = this.email !== this.originalUserData.email ? this.email : this.originalUserData.email;
            this.storedCredentials = {
                email: newEmail,
                password: password
            };

            this.authService.updateUser(this.userId, formData).subscribe({
                next: (response) => {
                    // Paso 2: Cerrar sesión después de actualizar
                    this.authService.logout();

                    // Paso 3: Reconexión automática con nueva configuración
                    this.reconnectUser(response.user);
                },
                error: (error) => {
                    console.error('Error actualizando perfil:', error);
                    Swal.fire('Error', this.getErrorMessage(error), 'error');
                    this.loading = false;
                }
            });
        });
    }

    private requestPassword(): Promise<string | null> {
        return new Promise((resolve) => {
            Swal.fire({
                title: 'Confirmar contraseña',
                text: 'Ingrese su contraseña actual para guardar los cambios',
                input: 'password',
                inputAttributes: {
                    autocapitalize: 'off',
                    autocorrect: 'off'
                },
                showCancelButton: true,
                confirmButtonText: 'Confirmar',
                cancelButtonText: 'Cancelar',
                allowOutsideClick: false,
                inputValidator: (value) => {
                    if (!value) return 'Debes ingresar tu contraseña';
                    return null;
                }
            }).then((result) => {
                resolve(result.isConfirmed ? result.value : null);
            });
        });
    }

    private reconnectUser(updatedUser: any): void {
        if (!this.storedCredentials) {
            this.loading = false;
            return;
        }

        // Intentar reconexión con las credenciales almacenadas
        this.authService.login({
            email: this.storedCredentials.email,
            password: this.storedCredentials.password
        }).subscribe({
            next: () => {
                // Actualizar datos del usuario con la nueva información
                this.authService.updateAuthStatus({
                    isAuthenticated: true,
                    userData: {
                        ...updatedUser,
                        // Preservar datos sensibles que no vienen en la respuesta
                        is_company: this.originalUserData.is_company,
                        is_provider: this.originalUserData.is_provider
                    }
                });

                Swal.fire('Éxito', 'Perfil actualizado y sesión renovada', 'success');
                this.dialogRef.close(true);
            },
            error: (error) => {
                Swal.fire({
                    title: 'Actualización exitosa',
                    text: 'Debes volver a iniciar sesión manualmente',
                    icon: 'success',
                    confirmButtonText: 'Entendido'
                });
                this.dialogRef.close(true);
            },
            complete: () => this.loading = false
        });
    }

    private getErrorMessage(error: any): string {
        if (error.error?.errors) {
            return Object.values(error.error.errors).join(', ');
        }
        return error.error?.message || 'Error al actualizar el perfil';
    }

    closeDialog(): void {
        this.checkChanges();

        if (this.hasChanges) {
            Swal.fire({
                title: '¿Descartar cambios?',
                text: 'Tienes modificaciones sin guardar',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Descartar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) this.dialogRef.close();
            });
        } else {
            this.dialogRef.close();
        }
    }

    requestRole(type: 'company' | 'provider') {
        this.requestService.submitRequest({
          user_id: this.userId,
          type,
          description: 'Solicitud de cambio de rol desde el perfil'
        }).subscribe({
          next: () => Swal.fire('Solicitud enviada', 'Tu solicitud será revisada por un administrador.', 'success'),
          error: () => Swal.fire('Error', 'No se pudo enviar la solicitud.', 'error')
        });
    }
}