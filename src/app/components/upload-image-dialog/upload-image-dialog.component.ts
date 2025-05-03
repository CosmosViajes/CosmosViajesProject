import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-upload-image-dialog',
  standalone: true,
  template: `
    <h2 mat-dialog-title>Subir nueva imagen</h2>
    <div mat-dialog-content>
      <input type="file" (change)="onFileSelected($event)" accept="image/*">
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Descripción</mat-label>
        <textarea matInput [(ngModel)]="description"></textarea>
      </mat-form-field>
    </div>
    <div mat-dialog-actions>
      <button mat-button (click)="dialogRef.close()">Cancelar</button>
      <button mat-raised-button color="primary" 
              [disabled]="!selectedFile || !description"
              (click)="upload()">
        Subir
      </button>
    </div>
  `,
  imports: [
    MatDialogModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
})
export class UploadImageDialogComponent {
  selectedFile?: File;
  description = '';

  constructor(
    public dialogRef: MatDialogRef<UploadImageDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  upload(): void {
    this.dialogRef.close({
      image: this.selectedFile,
      description: this.description
    });
  }
}