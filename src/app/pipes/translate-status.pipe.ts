import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'translateStatus',
  standalone: true // Opcional si usas standalone components
})
export class TranslateStatusPipe implements PipeTransform {
  transform(value: string): string {
    const translations: Record<string, string> = {
      'approved': 'aprobado',
      'rejected': 'rechazado',
      'pending': 'pendiente'
    };
    return translations[value] || value;
  }
}
