import { Component, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [FormsModule, MatInputModule, MatIconModule],
  template: `
    <div class="search-container">
      <mat-icon class="search-icon">search</mat-icon>
      <input
        matInput
        [(ngModel)]="searchTerm"
        (ngModelChange)="onSearch()"
        placeholder="Buscar vuelos, compañías o destinos..."
        class="search-input"
      />
    </div>
  `,
  styles: [`
    .search-container {
      display: flex;
      align-items: center;
      background: rgba(255, 255, 255, 0);
      border-radius: 24px;
      padding: 0 16px;
      margin: 2rem auto;
      max-width: 400px;
      transition: all 0.3s ease;
      &:focus-within {
        background: rgba(255, 255, 255, 0.05);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 1);
      }
    }
    .search-icon {
      color: rgba(255, 255, 255, 0.7);
      margin-right: 8px;
    }
    .search-input {
      flex: 1;
      color: white;
      padding: 12px 0;
      font-size: 16px;
      background: transparent;
      border: none;
      outline: none;
      &::placeholder {
        color: rgba(255, 255, 255, 0.5);
      }
    }
  `]
})
export class SearchBarComponent {
  searchTerm = '';
  @Output() searchChange = new EventEmitter<string>();

  onSearch() {
    this.searchChange.emit(this.searchTerm.toLowerCase());
  }
}
