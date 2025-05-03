import { Component } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { AuthService } from '../../services/auth.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-users-management',
  standalone: true,
  imports: [MatTableModule, MatIconModule],
  template: `
    <div class="users-table">
      <table mat-table [dataSource]="users">
        <!-- Columna ID -->
        <ng-container matColumnDef="id">
          <th mat-header-cell *matHeaderCellDef>ID</th>
          <td mat-cell *matCellDef="let user">{{ user.id }}</td>
        </ng-container>

        <!-- Columna Nombre -->
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Nombre</th>
          <td mat-cell *matCellDef="let user">{{ user.name }}</td>
        </ng-container>

        <!-- Columna Email -->
        <ng-container matColumnDef="email">
          <th mat-header-cell *matHeaderCellDef>Email</th>
          <td mat-cell *matCellDef="let user">{{ user.email }}</td>
        </ng-container>

        <!-- Columna Acciones -->
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Acciones</th>
          <td mat-cell *matCellDef="let user">
            <button mat-icon-button>
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button color="warn">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    </div>
  `,
  styles: [`
    .users-table {
      padding: 1rem;
      max-height: 400px;
      overflow: auto;
    }
  `]
})
export class UsersManagementComponent {
  displayedColumns: string[] = ['id', 'name', 'email', 'actions'];
  users: any[] = [];

  constructor(private authService: AuthService) {
    // Aquí deberías implementar la carga de usuarios desde tu API
  }
}