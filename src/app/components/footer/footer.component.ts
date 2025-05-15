import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [MatToolbarModule],
  template: `
    <mat-toolbar class="footer">
      <div class="footer-content">
        <span class="copyright">© 2025 COSMOVIAJES+ | TURISMO ESPACIAL</span>
        <span class="legal">
          <a href="#">Términos</a> | <a href="#">Privacidad</a> | <a href="#">Seguridad</a>
        </span>
      </div>
    </mat-toolbar>
  `,
  styles: `
    .footer {
      background-color: #000;
      color: #999;
      height: 60px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    .footer-content {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 2rem;
      font-size: 0.8rem;
    }
    a {
      color: #ccc;
      text-decoration: none;
      margin: 0 0.5rem;
      &:hover { color: white; }
    }
  `
})
export class FooterComponent {}