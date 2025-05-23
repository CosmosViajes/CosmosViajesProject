import { AuthService } from '../../services/auth.service';
import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { JwtHelperService } from '@auth0/angular-jwt';
import { MatDialog } from '@angular/material/dialog';
import { LoginDialogComponent } from '../login-dialog/login-dialog.component';
import { RegisterDialogComponent } from '../register-dialog/register-dialog.component';
import { CreateTripDialogComponent } from '../create-trip-dialog/create-trip-dialog.component';
import { ProfileDialogComponent } from '../profile-dialog/profile-dialog.component';
import { TripDetailsComponent } from '../trip-details/trip-details.component';
import { AdminPanelDialogComponent } from '../admin-panel-dialog/admin-panel-dialog.component';

interface ReservedTrip {
  trip: any;
  count: number;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    CommonModule,
    LoginDialogComponent,
    RegisterDialogComponent
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  // Variables internas para manejar temporizadores y el estado de los menús
  private menuTimer: any;
  private isManuallyOpened = false;
  private forceKeepMenu = false;
  private lastScrollPosition = 0;
  private lastUserMenuInteraction = 0;
  private userMenuTimer: any;

  // Variables para mostrar si el usuario está logueado, su nombre, foto, menús y reservas
  isLoggedIn = signal(false); // ¿El usuario está logueado?
  userName = signal(''); // Nombre del usuario
  userPhotoUrl = signal(''); // Foto del usuario
  showUserMenu = false; // ¿Mostrar el menú del usuario?
  showCartMenu = false; // ¿Mostrar el carrito?
  reservedTrips: ReservedTrip[] = []; // Lista de viajes reservados

  // Servicios y utilidades que usamos (autenticación, diálogos, etc.)
  private jwtHelper = inject(JwtHelperService);
  private dialog = inject(MatDialog);
  authService = inject(AuthService);

  // Cuando se inicia el componente
  ngOnInit() {
    this.checkContentHeight(); // Ajusta el menú según el alto de la página
    window.addEventListener('resize', this.checkContentHeight.bind(this)); // Si cambias el tamaño de la ventana, vuelve a comprobar

    // Cada vez que cambia el estado de autenticación (login/logout)
    this.authService.authStatus$.subscribe((status) => {
      this.isLoggedIn.set(status.isAuthenticated);

      if (status.isAuthenticated && status.userData) {
        // Si está logueado, ponemos su nombre y foto
        this.userName.set(status.userData.name || 'Usuario');
        this.userPhotoUrl.set(this.getPhotoUrl(status.userData.photo, this.userName()));

        // Si tenemos el id del usuario, cargamos sus reservas
        const userId = status.userData.id;
        if (userId !== undefined) {
          this.loadReservedTrips(userId);
        } else {
          // Si no, intentamos actualizar el id
          console.warn('El ID del usuario aún no está disponible. Intentando actualizar...');
          this.authService.updateUserId();
        }
      } else {
        // Si no está logueado, vaciamos los datos
        this.userName.set('');
        this.reservedTrips = [];
        this.userPhotoUrl.set('');
      }
    });

    // Cada vez que cambian las reservas, las agrupamos para mostrarlas bien
    this.authService.reservedTrips$.subscribe((trips) => {
      this.groupReservedTrips(trips);
    });
  }

  // Saca la foto del usuario o pone una de avatar si no hay
  private getPhotoUrl(photoData: any, userName: string): string {
    if (typeof photoData === 'string' && photoData.trim() !== '') {
      return photoData;
    } else {
      // Si no hay foto, usamos un avatar con el nombre
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'Usuario')}&background=random&size=128`;
    }
  }

  // Comprueba si hay un token válido en el navegador y, si lo hay, pone al usuario como logueado
  checkAuthStatus() {
    const token = localStorage.getItem('token');
    if (token && !this.jwtHelper.isTokenExpired(token)) {
      const decodedToken = this.jwtHelper.decodeToken(token);
      this.isLoggedIn.set(true);
      this.userName.set(decodedToken.name || 'Usuario');
      this.loadReservedTrips(decodedToken.id);
    }
  }

  // Agrupa las reservas para que si tienes varias del mismo viaje, las cuente juntas
  private groupReservedTrips(trips: any[]) {
    const grouped: ReservedTrip[] = [];
    trips.forEach(trip => {
      const existing = grouped.find(g => g.trip.id === trip.trip_id);
      if (existing) {
        existing.count++;
      } else {
        grouped.push({ trip: trip.trip, count: 1 });
      }
    });
    this.reservedTrips = grouped;
  }

  // Comprueba el alto de la página para ver si hay que dejar el menú siempre visible
  private checkContentHeight(): void {
    setTimeout(() => {
      const contentHeight = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );
      this.forceKeepMenu = contentHeight <= window.innerHeight + 1;
    }, 1);
  }

  // Carga los viajes reservados del usuario
  loadReservedTrips(userId: number): void {
    this.authService.getReservedTrips(userId).subscribe({
      next: (trips) => {
        this.groupReservedTrips(trips);
      },
      error: (err) => {
        console.error('Error al cargar los viajes reservados:', err);
      }
    });
  }

  // Abre o cierra el menú del carrito
  toggleCartMenu() {
    this.showCartMenu = !this.showCartMenu;
  }

  // Muestra los detalles de un viaje en una ventana emergente
  viewTripDetails(trip: any): void {
    this.dialog.open(TripDetailsComponent, {
      panelClass: 'custom-dialog-container',
      backdropClass: 'custom-backdrop',
      autoFocus: false,
      data: { trip: trip },
      position: {
        top: '0',
        left: '0'
      },
      maxWidth: 'none'
    });
  }

  // Cancela una reserva si el usuario pulsa el botón correspondiente
  cancelReservation(reservationId: number): void {
    const userId = this.authService.authStatus$.getValue()?.userData?.id;

    if (!userId) {
      console.error('No se pudo obtener el ID del usuario.');
      return;
    }

    this.authService.cancelReservation(userId, reservationId).subscribe({
      next: () => {
        this.authService.showSuccessAlert(
          '¡Reserva Cancelada!',
          'La reserva ha sido cancelada exitosamente.'
        );
        this.loadReservedTrips(userId);
      },
      error: (err) => {
        this.authService.showErrorAlert('Error al cancelar la reserva: ' + err.message);
        console.error('Error al cancelar la reserva:', err);
      },
    });
  }

  // Abre la ventana de login
  openLoginDialog() {
    const dialogRef = this.dialog.open(LoginDialogComponent, {
      width: '60vw',
      height: 'auto',
      panelClass: 'custom-dialog-container',
      backdropClass: 'custom-backdrop',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.checkAuthStatus();
      }
    });
  }

  // Abre la ventana de registro
  openRegisterDialog() {
    this.dialog.open(RegisterDialogComponent, {
      width: '60vw',
      height: 'auto',
      panelClass: 'custom-dialog-container',
      backdropClass: 'custom-backdrop',
    });
  }

  // Abre la ventana para crear un viaje nuevo (si el usuario está logueado)
  openCreateTripDialog() {
    const authStatus = this.authService.authStatus$.getValue();

    if (authStatus.isAuthenticated && authStatus.userData?.id) {
      const userId = authStatus.userData.id;

      const dialogRef = this.dialog.open(CreateTripDialogComponent, {
        data: { id: userId },
        width: '60vw',
        height: 'auto',
        panelClass: 'custom-dialog-container',
        backdropClass: 'custom-backdrop',
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          console.log('El viaje fue creado exitosamente.');
        }
      });
    } else {
      console.error('El usuario no está autenticado o no se pudo obtener el ID.');
    }
  }

  // Abre la ventana para ver el perfil del usuario
  viewProfile() {
    const authStatus = this.authService.authStatus$.getValue();

    if (!authStatus.userData) {
      console.error('No hay datos del usuario');
      return;
    }

    const dialogRef = this.dialog.open(ProfileDialogComponent, {
      data: { userData: authStatus.userData },
      width: '60vw',
      height: 'auto',
      panelClass: 'custom-dialog-container',
      backdropClass: 'custom-backdrop',
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Perfil cerrado:', result);
    });
  }

  // Abre o cierra el menú del usuario
  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
    if (this.showUserMenu) {
      this.startUserMenuTimer();
      this.lastUserMenuInteraction = Date.now();
    } else {
      this.clearUserMenuTimer();
    }
  }
  
  // Reinicia el temporizador del menú del usuario
  resetUserMenuTimer() {
    this.lastUserMenuInteraction = Date.now();
    this.startUserMenuTimer();
  }
  
  // Empieza el temporizador que cierra el menú del usuario si pasa mucho tiempo sin tocarlo
  private startUserMenuTimer() {
    this.clearUserMenuTimer();
    this.userMenuTimer = setInterval(() => {
      const now = Date.now();
      if (now - this.lastUserMenuInteraction >= 5000) {
        this.closeUserMenu();
      }
    }, 1000);
  }
  
  // Cierra el menú del usuario y limpia el temporizador
  closeUserMenu(): void {
    this.showUserMenu = false;
    this.clearUserMenuTimer();
  }
  
  private clearUserMenuTimer() {
    if (this.userMenuTimer) {
      clearInterval(this.userMenuTimer);
      this.userMenuTimer = null;
    }
  }

  // Si haces clic fuera del menú del usuario, lo cierra
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const isMenuButton = target.closest('.avatar');
    const isInMenu = target.closest('.user-menu');
    
    if (!isMenuButton && !isInMenu) {
      this.closeUserMenu();
    } else if (isInMenu) {
      this.resetUserMenuTimer();
    }
  }

  // Cierra sesión y borra los datos del usuario
  logout() {
    this.authService.logout();
    this.isLoggedIn.set(false);
    this.userName.set('');
    this.showUserMenu = false;
    this.reservedTrips = [];
    this.userPhotoUrl.set('');
  }

  // Si haces scroll, puede ocultar o mostrar el menú según cómo te muevas por la página
  @HostListener('window:scroll')
  onWindowScroll(): void {
    const currentScroll = window.pageYOffset;
    const scrollingDown = currentScroll > this.lastScrollPosition;

    if (currentScroll > 0 && scrollingDown && !this.isManuallyOpened && !this.forceKeepMenu) {
      this.closeMenu();
    } else if (currentScroll === 0) {
      this.isManuallyOpened = false;
      clearTimeout(this.menuTimer);
    }

    this.lastScrollPosition = currentScroll;
  }

  // Dice si el menú debe estar visible o no
  get shouldShowMenu(): boolean {
    return window.pageYOffset === 0 || this.isManuallyOpened || this.forceKeepMenu;
  }

  // Abre el menú por un rato
  openMenuTemporarily(): void {
    this.isManuallyOpened = true;
    this.startMenuTimer();
  }

  // Cierra el menú
  closeMenu(): void {
    this.isManuallyOpened = false;
    clearTimeout(this.menuTimer);
  }

  // Reinicia el temporizador del menú
  resetTimer(): void {
    this.startMenuTimer();
  }

  // Empieza el temporizador que cierra el menú si no haces nada en 5 segundos
  private startMenuTimer(): void {
    clearTimeout(this.menuTimer);
    if (window.pageYOffset > 0 && !this.forceKeepMenu) {
      this.menuTimer = setTimeout(() => {
        this.closeMenu();
      }, 5000);
    }
  }

  // Abre el panel de administración
  openAdminPanelDialog() {
    this.dialog.open(AdminPanelDialogComponent, {
      width: '60vw',
      panelClass: 'custom-dialog-container',
      backdropClass: 'custom-backdrop',
      autoFocus: false
    });
  }
}