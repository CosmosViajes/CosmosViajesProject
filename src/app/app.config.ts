import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { JWT_OPTIONS, JwtHelperService } from '@auth0/angular-jwt';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';


export function tokenGetter() {
  return localStorage.getItem('token');
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(),
    {
      provide: JWT_OPTIONS,
      useValue: {
        tokenGetter: tokenGetter,
        allowedDomains: ['cosmoviajes.local'],
        disallowedRoutes: [
          'http://cosmoviajes.local/login',
          'http://cosmoviajes.local/register'
        ]
      }
    },
    {
      provide: JwtHelperService,
      useFactory: () => new JwtHelperService()
    }
  ]
};