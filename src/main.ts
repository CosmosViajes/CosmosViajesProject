import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { JwtHelperService } from '@auth0/angular-jwt';
import { jwtInterceptor } from './app/services/jwt-interceptor';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

const combinedConfig = {
  ...appConfig,
  providers: [
    ...(appConfig.providers || []),
    provideHttpClient(withInterceptors([jwtInterceptor])),
    JwtHelperService,
    provideAnimationsAsync() // <-- Mover aquí
  ]
};

bootstrapApplication(AppComponent, combinedConfig)
  .catch(err => console.error(err));