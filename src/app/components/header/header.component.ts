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
  private menuTimer: any;
  private isManuallyOpened = false;
  private forceKeepMenu = false;
  private lastScrollPosition = 0;

  isLoggedIn = signal(false);
  userName = signal('');
  userPhotoUrl = signal('');
  showUserMenu = false;
  showCartMenu = false;
  reservedTrips: ReservedTrip[] = [];

  private jwtHelper = inject(JwtHelperService);
  private dialog = inject(MatDialog);
  authService = inject(AuthService);

  ngOnInit() {
    this.checkContentHeight();
    window.addEventListener('resize', this.checkContentHeight.bind(this));

    this.authService.authStatus$.subscribe((status) => {
      this.isLoggedIn.set(status.isAuthenticated);

      if (status.isAuthenticated && status.userData) {
        this.userName.set(status.userData.name || 'Usuario');

        this.userPhotoUrl.set(this.getPhotoUrl(status.userData.photo, this.userName()));


        const userId = status.userData.id;
        if (userId !== undefined) {
          this.loadReservedTrips(userId);
        } else {
          console.warn('El ID del usuario aún no está disponible. Intentando actualizar...');
          this.authService.updateUserId();
        }
      } else {
        this.userName.set('');
        this.reservedTrips = [];
        this.userPhotoUrl.set('');
      }
    });

    this.authService.reservedTrips$.subscribe((trips) => {
      this.groupReservedTrips(trips);
    });
  }

  private getPhotoUrl(photoData: any, userName: string): string {
    if (typeof photoData === 'string' && photoData.trim() !== '') {
      return photoData;
    } else {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'Usuario')}&background=random&size=128`;
    }
  }

  checkAuthStatus() {
    const token = localStorage.getItem('token');
    if (token && !this.jwtHelper.isTokenExpired(token)) {
      const decodedToken = this.jwtHelper.decodeToken(token);
      this.isLoggedIn.set(true);
      this.userName.set(decodedToken.name || 'Usuario');
      this.loadReservedTrips(decodedToken.id);
    }
  }

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

  toggleCartMenu() {
    this.showCartMenu = !this.showCartMenu;
  }

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

  openRegisterDialog() {
    this.dialog.open(RegisterDialogComponent, {
      width: '60vw',
      height: 'auto',
      panelClass: 'custom-dialog-container',
      backdropClass: 'custom-backdrop',
    });
  }

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

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;

    if (this.showUserMenu) {
      this.startMenuUserTimer();
    }
  }

  closeUserMenu(): void {
    this.showUserMenu = false;
    clearTimeout(this.menuTimer);
  }

  private startMenuUserTimer(): void {
    clearTimeout(this.menuTimer);
    this.menuTimer = setTimeout(() => {
      this.closeUserMenu();
    }, 5000);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const isMenuButton = target.closest('.menu-access');
    const isInMenu = target.closest('.nav-container');
    
    if (!isMenuButton && !isInMenu) {
      this.closeMenu();
    }
  }


  logout() {
    this.authService.logout();
    this.isLoggedIn.set(false);
    this.userName.set('');
    this.showUserMenu = false;
    this.reservedTrips = [];
    this.userPhotoUrl.set('');
  }

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

  get shouldShowMenu(): boolean {
    return window.pageYOffset === 0 || this.isManuallyOpened || this.forceKeepMenu;
  }

  openMenuTemporarily(): void {
    this.isManuallyOpened = true;
    this.startMenuTimer();
  }

  closeMenu(): void {
    this.isManuallyOpened = false;
    clearTimeout(this.menuTimer);
  }

  resetTimer(): void {
    this.startMenuTimer();
  }

  private startMenuTimer(): void {
    clearTimeout(this.menuTimer);
    if (window.pageYOffset > 0 && !this.forceKeepMenu) {
      this.menuTimer = setTimeout(() => {
        this.closeMenu();
      }, 5000);
    }
  }

  openAdminPanelDialog() {
    this.dialog.open(AdminPanelDialogComponent, {
      width: '60vw',
      panelClass: 'custom-dialog-container',
      backdropClass: 'custom-backdrop',
      autoFocus: false
    });
  }

}