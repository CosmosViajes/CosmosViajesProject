import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { FlightsListComponent } from './components/flights-list/flights-list.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, FlightsListComponent],
  template: `
    <app-header/>
    <main class="content">
      <router-outlet></router-outlet>
    </main>
    <app-footer/>
  `,
  styles: `
    .content {
      min-height: calc(100vh - 140px);
      background-color: #0a0a0a;
      color: white;
    }
  `
})
export class AppComponent {}
