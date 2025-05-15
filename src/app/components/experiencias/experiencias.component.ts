import { Component, AfterViewInit, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { switchMap, tap } from 'rxjs';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { ExperienciasService } from '../../services/experiencias.service';
import { AuthService } from '../../services/auth.service';
import { UploadImageDialogComponent } from '../upload-image-dialog/upload-image-dialog.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { RegisterDialogComponent } from '../register-dialog/register-dialog.component';
import { LoginDialogComponent } from '../login-dialog/login-dialog.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-experiencias',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule
  ],
  template: `
    <div class="experiencias-wrapper">
      <div class="experiencias-container" [class.short-content]="isShortContent">
        <h1 class="title">EXPERIENCIAS DE VIAJEROS</h1>
        
        <mat-tab-group>
          <mat-tab label="Testimonios">
            <div class="social-feed">
              <mat-card class="new-post">
                <textarea [(ngModel)]="newComment" 
                          placeholder="Comparte tu experiencia..."></textarea>
                <button mat-raised-button color="primary" (click)="addComment()">
                  <mat-icon>send</mat-icon> PUBLICAR
                </button>
              </mat-card>
              <div class="comments-section">
                @for (comment of comments; track comment.id) {
                  <mat-card class="comment-card">
                    <div class="comment-header">
                      <span class="userName">{{ comment.userName }}</span>
                      <span class="date">{{ comment.date | date:'mediumDate' }}</span>
                    </div>
                    <p class="comment-text">{{ comment.text }}</p>
                    <div class="comment-actions">
                      <span 
                        class="likes-count" 
                        [ngClass]="{'liked': userLikes.has(comment.id)}">
                        {{ comment.likes }}
                      </span>
                      <button mat-icon-button
                              [id]="'like-btn-' + comment.id"
                              (click)="likeComment(comment.id)"
                              [ngClass]="{ 'liked': userLikes.has(comment.id) }"
                              [attr.aria-pressed]="userLikes.has(comment.id)">
                        <mat-icon>thumb_up</mat-icon>
                      </button>
                      <button mat-icon-button 
                              *ngIf="isCurrentUserComment(comment)"
                              (click)="deleteComment(comment.id)"
                              class="delete-btn">
                        <mat-icon>delete</mat-icon>
                      </button>
                      <span hidden>{{ comment.user_id }}</span>
                    </div>

                  </mat-card>
                }
              </div>
            </div>
          </mat-tab>

          <mat-tab label="Galería">
            <div class="gallery-grid">
              @for (image of galleryImages; track image.id) {
                <mat-card class="image-card" (click)="openImageModal(image)">
                  <div class="image-container">
                    <img [src]="image.url" [alt]="image.description">
                    <button *ngIf="isCurrentUserImage(image)" 
                            mat-icon-button 
                            class="delete-btn"
                            (click)="$event.stopPropagation(); deleteImage(image.id)">
                      <mat-icon>close</mat-icon>
                    </button>
                  </div>
                </mat-card>
              }
              <!-- SOLO mostrar el botón si el usuario está autenticado -->
              <div 
                class="add-image-card"
                *ngIf="authStatus?.isAuthenticated"
                (click)="openUploadDialog()">
                <mat-icon>add</mat-icon>
                <span>Añadir imagen</span>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
        <div *ngIf="isShortContent" class="content-filler"></div>
      </div>
    </div>
  `,
  styles: [`

    mat-tab-header {
      background-color: black;
    }
    .experiencias-wrapper {
      width: 100%;
      overflow-x: hidden;
      background: linear-gradient(to bottom, 
                  rgba(0,0,0,0.9) 0%, 
                  rgba(0,0,0,0.7) 30%,
                  rgba(0,0,0,0.5) 100%);
      min-height: calc(100vh - 60px);
      padding: 60px 0 2rem;
      box-sizing: border-box;
    }
    
    .experiencias-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
      width: 100%;
      box-sizing: border-box;
      position: relative;
    }
    
    .title {
      text-align: center;
      font-weight: 300;
      letter-spacing: 3px;
      margin: 0 0 2rem;
      color: white;
      padding-top: 1rem;
      font-size: 2rem;
    }
    
    .social-feed {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .new-post {
      padding: 1.5rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      backdrop-filter: blur(5px);
      
      textarea {
        width: calc(100% - 2rem);
        min-height: 100px;
        margin-bottom: 1rem;
        padding: 1rem;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        color: white;
        font-family: inherit;
        resize: vertical;
        transition: border-color 0.3s ease;
        
        &:focus {
          outline: none;
          border-color: #42a5f5;
        }
        
        &::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }
      }
      
      button {
        width: 100%;
      }
    }
    
    .comments-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      width: 100%;
    }
    
    .comment-card {
      padding: 1.5rem;
      background: rgba(16, 16, 16, 0.8);
      border-radius: 8px;
      backdrop-filter: blur(3px);
      
      .comment-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 1rem;
        flex-wrap: wrap;
        
        .userName {
          font-weight: 500;
          color: #42a5f5;
        }
        .date {
          color: #aaa;
          font-size: 0.8rem;
        }
      }
      
      .comment-text {
        margin: 0;
        line-height: 1.6;
        word-break: break-word;
      }
      
      .comment-actions {
        margin-top: 1rem;
        display: flex;
        align-items: center;
        
        button {
          margin-right: 1rem;
          color: rgba(255, 255, 255, 0.7);
          
          &:hover {
            color: #42a5f5;
          }
          
          mat-icon {
            margin-right: 5px;
            font-size: 20px;
          }
        }
      }
    }
    .likes-count {
      display: inline-block;
      min-width: 2ch;
      text-align: right;
      font-size: 1.1em;
      color: #aaa;
      font-weight: 600;
      margin-right: 4px;
      margin-left: 2px;
      transition: color 0.3s;
    }
    .likes-count.liked {
      color: #43a047; /* Verde si el usuario dio like */
    }
    .comment-actions button.liked {
      color: #43a047 !important; /* Verde */
      background: rgba(67, 160, 71, 0.15);
      transition: background 0.3s, color 0.3s;
    }
    .like-anim-blue {
      animation: like-blue 0.6s;
    }
    .like-anim-green {
      animation: like-green 0.6s;
    }
    .like-anim-red {
      animation: like-red 0.6s;
    }
    @keyframes like-blue {
      0% { box-shadow: 0 0 0 0 #42a5f5; }
      50% { box-shadow: 0 0 10px 5px #42a5f5; }
      100% { box-shadow: 0 0 0 0 #42a5f5; }
    }
    @keyframes like-green {
      0% { box-shadow: 0 0 0 0 #43a047; }
      50% { box-shadow: 0 0 10px 5px #43a047; }
      100% { box-shadow: 0 0 0 0 #43a047; }
    }
    @keyframes like-red {
      0% { box-shadow: 0 0 0 0 #e53935; }
      50% { box-shadow: 0 0 10px 5px #e53935; }
      100% { box-shadow: 0 0 0 0 #e53935; }
    }
    
    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1.5rem;
      padding: 1rem;
    }

    .image-card {
      position: relative;
      cursor: pointer;
      transition: transform 0.3s ease;

      &:hover {
        transform: scale(1.03);
      }
    }

    .image-container {
      position: relative;
      height: 250px;
      overflow: hidden;
      border-radius: 8px;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .add-image-card {
      height: 250px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 2px dashed rgba(255, 255, 255, 0.3);
      border-radius: 8px;
      cursor: pointer;
      transition: border-color 0.3s ease;
      
      &:hover {
        border-color: #42a5f5;
      }
      
      mat-icon {
        font-size: 3rem;
        width: 3rem;
        height: 3rem;
        margin-bottom: 1rem;
      }
    }

    .image-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      
      img {
        max-width: 90%;
        max-height: 80vh;
        object-fit: contain;
        border-radius: 8px;
      }
      
      .description {
        color: white;
        margin-top: 1rem;
        max-width: 600px;
        text-align: center;
      }
      
      .close-btn {
        position: absolute;
        top: 20px;
        right: 20px;
      }
    }
      
      mat-card-footer {
        padding: 1rem;
        background: rgba(0, 0, 0, 0.7);
        
        p {
          margin: 0 0 0.5rem 0;
          font-weight: 500;
          color: white;
        }
        
        span {
          color: #aaa;
          font-size: 0.8rem;
        }
      }
    }
    
    .content-filler {
      height: calc(100vh - 500px);
      opacity: 0;
      pointer-events: none;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .experiencias-wrapper {
        min-height: calc(100vh - 120px);
        padding-top: 80px;
      }
      
      .title {
        font-size: 1.5rem;
        margin-bottom: 1.5rem;
      }
      
      .new-post {
        padding: 1rem;
        
        textarea {
          width: calc(100% - 1rem);
          padding: 0.8rem;
        }
      }
      
      .gallery-grid {
        grid-template-columns: 1fr;
      }
      
      .comment-card {
        padding: 1rem;
      }
    }
    
    .delete-btn {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 40px;
      height: 40px;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.6);
      color: white !important;
      padding: 0;
      z-index: 2;
      box-sizing: border-box;
      /* Opcional: transición para hover */
      transition: background 0.2s;
    }
    .delete-btn:hover {
      background: rgba(255, 0, 0, 0.8);
    }
    .delete-btn mat-icon {
      font-size: 24px;
      line-height: 24px;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

  `]
})

export class ExperienciasComponent implements AfterViewInit, OnInit, OnDestroy {
  selectedFile?: File;
  description = '';
  newComment = '';
  isShortContent = false;
  comments: any[] = [];
  galleryImages: any[] = [];
  userLikes: Set<number> = new Set();
  selectedImage: any = null;
  showImageModal: boolean = false;
  authStatus: any = null;

  constructor(
    private authService: AuthService,
    private experienciasService: ExperienciasService,
    private dialog: MatDialog // Solo MatDialog aquí
  ) {}

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  openUploadDialog(): void {
    if (!this.authStatus?.isAuthenticated) {
      Swal.fire({
        icon: 'info',
        title: '¡Debes iniciar sesión o registrarte!',
        html: `
          <div style="font-size:1.15em;">
            <p>Para publicar una imagen necesitas tener una cuenta.</p>
            <p>
              <b>Inicia sesión</b> si ya tienes cuenta,<br>
              o <b>regístrate</b> si eres nuevo usuario.
            </p>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Iniciar sesión',
        cancelButtonText: 'Registrarme',
        confirmButtonColor: '#1976d2',
        cancelButtonColor: '#43a047',
        background: '#f8fafc',
        customClass: {
          popup: 'rounded-xl shadow-lg',
          title: 'text-xl font-semibold text-blue-700',
          htmlContainer: 'text-center'
        }
      }).then((result) => {
        if (result.isConfirmed) {
          // Lógica para abrir el diálogo de login
          this.openLoginDialog();
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          // Lógica para abrir el diálogo de registro
          this.openRegisterDialog();
        }
      });
      return;
    }
  
    const dialogRef = this.dialog.open(UploadImageDialogComponent, {
      width: '500px',
      data: { description: '' }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.uploadImage(result);
      }
    });
  }
  
  // Métodos para los diálogos de login y registro (ajusta según tu app)
  openLoginDialog() {
    this.dialog.open(LoginDialogComponent, {
      width: '60vw',
      height: 'auto',
      panelClass: 'custom-dialog-container',
      backdropClass: 'custom-backdrop'
    });
  }
  
  openRegisterDialog() {
    this.dialog.open(RegisterDialogComponent, {
      width: '60vw',
      height: 'auto',
      panelClass: 'custom-dialog-container',
      backdropClass: 'custom-backdrop'
    });
  }  

  ngOnInit() {
    this.authStatus = this.authService.authStatus$?.getValue?.() || null;
    
    // 1. Primero cargar experiencias
    this.loadExperiencias().pipe(
        // 2. Luego cargar likes del usuario
        switchMap(() => this.loadUserLikes())
    ).subscribe();
  }

  loadExperiencias() {
    return this.experienciasService.getExperiencias().pipe(
        tap(data => {
            this.comments = data.filter((exp: any) => !exp.image);
            this.galleryImages = data.filter((exp: any) => exp.image).map((img: any) => ({
                id: img.id,
                url: img.image,
                description: img.description,
                user_id: img.user_id
            }));
        })
    );
  }

  loadUserLikes() {
    return this.experienciasService.getUserLikes().pipe(
        tap(likes => {
            this.userLikes = new Set(likes);
        })
    );
  }

  addComment() {
    if (!this.authStatus?.isAuthenticated) {
      Swal.fire({
        icon: 'info',
        title: '¡Debes iniciar sesión o registrarte!',
        html: `
          <div style="font-size:1.15em;">
            <p>Para publicar una experiencia necesitas tener una cuenta.</p>
            <p>
              <b>Inicia sesión</b> si ya tienes cuenta,<br>
              o <b>regístrate</b> si eres nuevo usuario.
            </p>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Iniciar sesión',
        cancelButtonText: 'Registrarme',
        confirmButtonColor: '#1976d2',
        cancelButtonColor: '#43a047',
        background: '#f8fafc',
        customClass: {
          popup: 'rounded-xl shadow-lg',
          title: 'text-xl font-semibold text-blue-700',
          htmlContainer: 'text-center'
        }
      }).then((result) => {
        if (result.isConfirmed) {
          this.openLoginDialog();
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          this.openRegisterDialog();
        }
      });
      return;
    }
  
    if (this.newComment.trim()) {
      const authStatus = this.authService.authStatus$.getValue();
      const userName = authStatus?.userData?.name || 'Usuario';
      const userId = authStatus?.userData?.id || 0;
  
      this.experienciasService.addExperiencia({
        user_Id: userId,
        userName: userName,
        text: this.newComment
      }).subscribe({
        next: (newExp) => {
          this.comments.unshift(newExp);
          this.newComment = '';
        },
        error: (err) => console.error('Error guardando experiencia:', err)
      });
    }
  }  

  likeComment(commentId: number) {
    // Efecto visual: azul al dar like, verde si ya está dado, rojo al quitar
    const authStatus = this.authService.authStatus$.getValue();
    const userId = authStatus?.userData?.id || 0;
    const alreadyLiked = this.userLikes.has(commentId);
    this.experienciasService.toggleLike(commentId, userId).subscribe({
      next: (res) => {
        // Actualiza likes en el comentario
        const comment = this.comments.find(c => c.id === commentId);
        if (comment) {
          comment.likes = res.likes;
        }
        if (res.liked) {
          this.userLikes.add(commentId);
          this.animateLike(commentId, alreadyLiked ? 'green' : 'blue');
        } else {
          this.userLikes.delete(commentId);
          this.animateLike(commentId, 'red');
        }
      }
    });
  }

  animateLike(commentId: number, color: 'blue' | 'green' | 'red') {
    const btn = document.getElementById('like-btn-' + commentId);
    if (btn) {
      btn.classList.add(`like-anim-${color}`);
      setTimeout(() => btn.classList.remove(`like-anim-${color}`), 600);
    }
  }

  checkContentHeight(): void {
    setTimeout(() => {
      const contentHeight = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );
      this.isShortContent = contentHeight <= window.innerHeight + 200;
    }, 100);
  }  

  ngAfterViewInit() {
    this.checkContentHeight();
    window.addEventListener('resize', this.checkContentHeight.bind(this));
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.checkContentHeight.bind(this));
  }

  deleteComment(commentId: number) {
    Swal.fire({
      title: '¿Eliminar comentario?',
      text: 'No podrás revertir esto',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.experienciasService.deleteExperiencia(commentId).subscribe({
          next: () => {
            this.comments = this.comments.filter(c => c.id !== commentId);
            Swal.fire('Eliminado!', 'Tu comentario ha sido eliminado.', 'success');
          },
          error: (err) => {
            Swal.fire('Error', 'No tienes permiso para eliminar este comentario', 'error');
          }
        });
      }
    });
  }
  
  isCurrentUserComment(comment: any): boolean {
    const authStatus = this.authService.authStatus$.getValue();
    return authStatus?.userData?.id === comment.user_id;
  }

  uploadImage(data: { image: File, description: string }): void {
    const formData = new FormData();
    formData.append('image', data.image);
    formData.append('description', data.description);

    this.experienciasService.uploadImage(formData).subscribe({
      next: (newImage) => {
        this.galleryImages.unshift(newImage);
      },
      error: (err) => console.error('Error subiendo imagen:', err)
    });
  }

  openImageModal(image: any): void {
    this.selectedImage = image;
    this.showImageModal = true;
  }

  closeImageModal(): void {
    this.showImageModal = false;
    this.selectedImage = null;
  }

  deleteImage(imageId: number): void {
    Swal.fire({
      title: '¿Eliminar imagen?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.experienciasService.deleteImage(imageId).subscribe({
          next: () => {
            this.galleryImages = this.galleryImages.filter(img => img.id !== imageId);
          },
          error: (err) => console.error('Error eliminando imagen:', err)
        });
      }
    });
  }

  isCurrentUserImage(image: any): boolean {
    const authStatus = this.authService.authStatus$.getValue();
    
    return authStatus?.isAuthenticated && authStatus.userData?.id === image.user_id;
  }  

}