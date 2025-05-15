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
        allowedDomains: ['https://cosmosviajesbackend.onrender.com/'],
        disallowedRoutes: [
          'https://cosmosviajesbackend.onrender.com/login',
          'https://cosmosviajesbackend.onrender.com/register'
        ]
      }
    },
    {
      provide: JwtHelperService,
      useFactory: () => new JwtHelperService()
    }
  ]
};