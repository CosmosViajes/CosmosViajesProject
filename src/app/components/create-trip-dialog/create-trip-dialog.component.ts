import { Component, Inject, ViewChild, ElementRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TripService } from '../../services/trip.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';


@Component({
  selector: 'app-create-trip-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule
  ],
  templateUrl: './create-trip-dialog.component.html',
  styleUrls: ['./create-trip-dialog.component.css']
})
export class CreateTripDialogComponent {
  @ViewChild('fileInput') fileInput!: ElementRef;
  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;

  tripForm: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<CreateTripDialogComponent>,
    private fb: FormBuilder,
    private tripService: TripService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.tripForm = this.fb.group({
      name: ['', Validators.required],
      type: ['', Validators.required],
      departure: ['', Validators.required],
      duration: ['', Validators.required],
      capacity: [1, [Validators.required, Validators.min(1)]],
      price: [0, [Validators.required, Validators.min(0)]],
      description: ['', Validators.required]
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      
      // Mostrar previsualización
      const reader = new FileReader();
      reader.onload = () => this.previewUrl = reader.result;
      reader.readAsDataURL(this.selectedFile);
    }
  }

  onSubmit() {
    if (this.tripForm.valid && this.selectedFile) {
      const formData = new FormData();
      
      // Añadir datos del formulario
      formData.append('name', this.tripForm.get('name')?.value);
      formData.append('company_id', this.data.id);
      formData.append('type', this.tripForm.get('type')?.value);
      formData.append('departure', this.tripForm.get('departure')?.value);
      formData.append('duration', this.tripForm.get('duration')?.value);
      formData.append('capacity', this.tripForm.get('capacity')?.value);
      formData.append('price', this.tripForm.get('price')?.value);
      formData.append('description', this.tripForm.get('description')?.value);
      
      // Añadir imagen
      formData.append('photo', this.selectedFile);

      this.tripService.createTrip(formData).subscribe({
        next: (response) => {
          this.snackBar.open('Viaje creado exitosamente', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('Error:', err);
          this.snackBar.open('Error al crear el viaje', 'Cerrar');
        }
      });
    } else {
      this.snackBar.open('Por favor, complete todos los campos y seleccione una imagen', 'Cerrar');
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}