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

// Este componente es una ventana que se abre para crear un viaje nuevo

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
  // Esto es para manejar el archivo de la imagen que sube el usuario
  @ViewChild('fileInput') fileInput!: ElementRef;
  selectedFile: File | null = null; // Aquí guardamos la imagen seleccionada
  previewUrl: string | ArrayBuffer | null = null; // Aquí guardamos la previsualización de la imagen

  // Aquí guardamos los datos del formulario (nombre, tipo, precio, etc.)
  tripForm: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<CreateTripDialogComponent>, // Para cerrar la ventana
    private fb: FormBuilder, // Para crear el formulario
    private tripService: TripService, // Para enviar los datos al servidor
    private snackBar: MatSnackBar, // Para mostrar mensajes rápidos
    @Inject(MAT_DIALOG_DATA) public data: any // Aquí recibimos datos del exterior, como el id de la empresa
  ) {
    // Aquí se definen los campos del formulario y las reglas (por ejemplo, que no estén vacíos)
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

  // Esta función se llama cuando el usuario selecciona una imagen
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      
      // Mostramos una previsualización de la imagen para que el usuario vea cómo queda
      const reader = new FileReader();
      reader.onload = () => this.previewUrl = reader.result;
      reader.readAsDataURL(this.selectedFile);
    }
  }

  // Esta función se llama cuando el usuario pulsa el botón de crear viaje
  onSubmit() {
    // Primero comprobamos que todos los campos estén bien y que haya imagen
    if (this.tripForm.valid && this.selectedFile) {
      const formData = new FormData();
      
      // Añadimos los datos del formulario
      formData.append('name', this.tripForm.get('name')?.value);
      formData.append('company_id', this.data.id);
      formData.append('type', this.tripForm.get('type')?.value);
      formData.append('departure', this.tripForm.get('departure')?.value);
      formData.append('duration', this.tripForm.get('duration')?.value);
      formData.append('capacity', this.tripForm.get('capacity')?.value);
      formData.append('price', this.tripForm.get('price')?.value);
      formData.append('description', this.tripForm.get('description')?.value);
      
      // Añadimos la imagen seleccionada
      formData.append('photo', this.selectedFile);

      // Enviamos los datos al servidor para crear el viaje
      this.tripService.createTrip(formData).subscribe({
        next: (response) => {
          // Si todo va bien, mostramos un mensaje y cerramos la ventana
          this.snackBar.open('Viaje creado exitosamente', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (err) => {
          // Si hay error, mostramos un mensaje de error
          console.error('Error:', err);
          this.snackBar.open('Error al crear el viaje', 'Cerrar');
        }
      });
    } else {
      // Si falta algún campo o la imagen, avisamos al usuario
      this.snackBar.open('Por favor, complete todos los campos y seleccione una imagen', 'Cerrar');
    }
  }

  // Esta función se llama si el usuario cancela y quiere cerrar la ventana sin hacer nada
  onCancel() {
    this.dialogRef.close();
  }
}