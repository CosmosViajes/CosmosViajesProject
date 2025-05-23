import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TripService } from '../../services/trip.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-edit-trip-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  providers: [DatePipe],
  template: `
    <div class="trip-details-container edit-trip-container" [formGroup]="editForm">
      <button mat-icon-button class="close-button" (click)="dialogRef.close()">
        <mat-icon>close</mat-icon>
      </button>

      <div class="trip-header">
        <input type="text" formControlName="name" placeholder="Nombre del viaje" class="trip-name-input" />
        <select formControlName="type" class="trip-type-select">
          <option value="Orbital">Orbital</option>
          <option value="Suborbital">Suborbital</option>
          <option value="Lunar">Lunar</option>
          <option value="Espacial">Espacial</option>
        </select>
      </div>

      <div class="trip-body">
        <div class="trip-image-container">
          <img [src]="data.trip.photo" alt="Imagen del viaje" class="trip-image" />
          <input type="file" (change)="onFileSelected($event)" class="image-input" />
          <div class="price-badge">
            <input type="number" formControlName="price" class="price-input" />
          </div>
        </div>

        <div class="trip-meta">
          <div class="meta-item">
            <mat-icon class="meta-icon">flight_takeoff</mat-icon>
            <div style="width: 70%;">
              <p class="meta-label">Fecha de salida</p>
              <input type="date" formControlName="departure" class="meta-value-input" />
            </div>
          </div>

          <div class="meta-item">
            <mat-icon class="meta-icon">flight_land</mat-icon>
            <div style="width: 70%;">
              <p class="meta-label">Fecha de regreso</p>
              <input type="date" formControlName="duration" class="meta-value-input" />
            </div>
          </div>

          <div class="meta-item">
            <mat-icon class="meta-icon">group</mat-icon>
            <div style="width: 70%;">
              <p class="meta-label">Plazas disponibles</p>
              <input type="number" formControlName="capacity" class="meta-value-input" />
            </div>
          </div>
        </div>

        <div class="trip-description">
          <h3>Descripción del viaje</h3>
          <textarea formControlName="description" class="description-textarea"></textarea>
        </div>

        <div class="edit-controls">
          <button mat-raised-button type="button" color="warn" class="cancel-button" (click)="dialogRef.close()">
            <mat-icon>close</mat-icon>
            CANCELAR
          </button>

          <button mat-raised-button type="submit" color="primary" class="save-button" [disabled]="editForm.invalid" (click)="onSubmit()">
            <mat-icon>save</mat-icon>
            GUARDAR CAMBIOS
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .trip-details-container.edit-trip-container {
      margin: 20px auto;
      position: relative;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 16px;
      padding: 2rem;
      color: white;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
      max-height: 90vh;
    }

    .close-button {
      position: absolute;
      top: 10px;
      right: 10px;
      color: rgba(255, 255, 255, 0.7);
      transition: all 0.3s ease;
      z-index: 10;
    }

    .close-button:hover {
      color: white;
      transform: scale(1.1);
    }

    .trip-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .trip-name-input {
      background: transparent;
      border: none;
      color: white;
      font-size: 1.8rem;
      font-weight: 700;
      width: 70%;
      padding: 0.5rem 0;
      border-bottom: 2px solid rgba(255, 255, 255, 0.2);
      transition: all 0.3s ease;
    }

    .trip-name-input:focus {
      outline: none;
      border-bottom-color: #4fc3f7;
    }

    .trip-type-select {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: white;
      font-weight: 600;
      font-size: 0.9rem;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      width: 25%;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }

    .trip-type-select:hover,
    .trip-type-select:focus {
      background: rgba(255, 255, 255, 0.3);
      outline: none;
    }

    .trip-body {
      display: grid;
      gap: 1.5rem;
    }

    .trip-image-container {
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      height: 250px;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
    }

    .trip-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .image-input {
      position: absolute;
      bottom: 10px;
      left: 10px;
      background-color: rgba(0, 0, 0, 0.5);
      color: white;
      padding: 5px;
      border-radius: 5px;
      cursor: pointer;
    }

    .price-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: rgba(0, 0, 0, 0.7);
      color: #4fc3f7;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: 700;
      font-size: 1.1rem;
      backdrop-filter: blur(5px);
    }

    .price-input {
      background: transparent;
      border: none;
      color: #4fc3f7;
      font-size: 1.1rem;
      font-weight: 700;
      text-align: right;
      width: 100px;
      padding: 0.2rem;
    }

    .price-input:focus {
      outline: none;
    }

    .trip-meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: 1rem;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      padding: 0.8rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      transition: all 0.3s ease;
    }

    .meta-item:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .meta-icon {
      font-size: 1.8rem;
      width: 1.8rem;
      height: 1.8rem;
    }

    .meta-label {
      margin: 0;
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.8rem;
    }

    .meta-value-input {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      color: white;
      padding: 0.5rem;
      width: 100%;
      margin-top: 0.2rem;
    }

    .meta-value-input:focus {
      outline: none;
      border-color: #4fc3f7;
    }

    .trip-description {
      background: rgba(255, 255, 255, 0.05);
      padding: 1.2rem;
      border-radius: 10px;
      line-height: 1.6;
    }

    .description-textarea {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      color: white;
      width: 100%;
      min-height: 100px;
      padding: 1rem;
      resize: vertical;
    }

    .description-textarea:focus {
      outline: none;
      border-color: #4fc3f7;
    }

    .edit-controls {
      display: flex;
      gap: 1rem;
      margin-top: 1.5rem;
      justify-content: center;
      flex-wrap: nowrap;
    }

    .edit-controls button {
      flex: 1;
      min-width: 250px;
      max-width: 300px;
      padding: 0.8rem 1.5rem;
      font-weight: 600;
      letter-spacing: 0.5px;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .edit-controls button:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    }

    .save-button {
      background: linear-gradient(45deg, #4CAF50, #2E7D32);
      color: white !important;
    }

    .save-button:hover {
      box-shadow: 0 5px 15px rgba(76, 175, 80, 0.3) !important;
    }

    .cancel-button {
      background: linear-gradient(45deg, #F44336, #D32F2F);
      color: white !important;
    }

    .cancel-button:hover {
      box-shadow: 0 5px 15px rgba(244, 67, 54, 0.3) !important;
    }
  `]
})
export class EditTripDialogComponent implements OnInit {
  // Aquí guardamos el formulario para editar el viaje y la imagen seleccionada (si hay)
  editForm: FormGroup;
  selectedFile: File | null = null;

  constructor(
    public dialogRef: MatDialogRef<EditTripDialogComponent>, // Para cerrar la ventana
    @Inject(MAT_DIALOG_DATA) public data: any, // Aquí recibimos los datos del viaje a editar
    private fb: FormBuilder, // Para crear el formulario
    private tripService: TripService, // Para enviar los cambios al servidor
    private snackBar: MatSnackBar, // Para mostrar mensajes rápidos
    private datePipe: DatePipe // Para dar formato a las fechas
  ) {
    // Aquí se definen los campos del formulario y las reglas (por ejemplo, que no estén vacíos)
    this.editForm = this.fb.group({
      name: ['', Validators.required],
      type: ['', Validators.required],
      departure: ['', Validators.required],
      duration: ['', Validators.required],
      capacity: ['', Validators.required],
      price: ['', Validators.required],
      description: ['', Validators.required],
      photo: [''] 
    });
  }

  // Cuando se abre la ventana, rellenamos el formulario con los datos del viaje que vamos a editar
  ngOnInit(): void {
    if (this.data && this.data.trip) {
      // Ponemos las fechas en el formato correcto para el formulario
      const formattedDepartureDate = this.datePipe.transform(this.data.trip.departure, 'yyyy-MM-dd');
      const formattedDurationDate = this.datePipe.transform(this.data.trip.duration, 'yyyy-MM-dd');

      // Rellenamos el formulario con los datos actuales del viaje
      this.editForm.patchValue({
        name: this.data.trip.name,
        type: this.data.trip.type,
        departure: formattedDepartureDate,
        duration: formattedDurationDate,
        capacity: this.data.trip.capacity,
        price: this.data.trip.price,
        description: this.data.trip.description,
        photo: this.data.trip.photo
      });
    }
  }

  // Cuando el usuario selecciona una nueva imagen, la guardamos
  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  // Cuando el usuario pulsa el botón de guardar cambios
  onSubmit() {
    // Si todo está bien en el formulario
    if (this.editForm.valid) {
      const updatedFields: any = {};
      // Miramos qué campos han cambiado
      Object.keys(this.editForm.controls).forEach(key => {
        if (key !== 'photo' && this.editForm.get(key)?.value !== this.data.trip[key]) {
          updatedFields[key] = this.editForm.get(key)?.value;
        }
      });

      // Si hay una imagen nueva, la añadimos
      if (this.selectedFile) {
        updatedFields['photo'] = this.selectedFile;
      }

      // Si no se ha cambiado nada, avisamos al usuario
      if (Object.keys(updatedFields).length === 0) {
        this.snackBar.open('No hay cambios para guardar', 'Cerrar', { duration: 2000 });
        return;
      }

      // Creamos los datos para enviar al servidor, incluyendo la imagen si hay
      const formData = new FormData();
      for (const key in updatedFields) {
        formData.append(key, updatedFields[key]);
      }

      // Enviamos los cambios al servidor para actualizar el viaje
      this.tripService.updateTrip(this.data.trip.id, formData).subscribe({
        next: () => {
          this.snackBar.open('Viaje actualizado correctamente', 'Cerrar', { duration: 2000 });
          this.dialogRef.close('updated'); // Cerramos la ventana y avisamos que se actualizó
        },
        error: (error) => {
          this.snackBar.open('Error al actualizar el viaje', 'Cerrar', { duration: 2000 });
        }
      });
    }
  }
}