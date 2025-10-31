import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { TmdbImage } from '../../../../core/models/tmdb-model';
import { Firestore, collection, getDocs, doc, updateDoc } from '@angular/fire/firestore';
import { ButtonModule } from 'primeng/button';
import { PanelModule } from 'primeng/panel';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { ImageModule } from 'primeng/image';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-fstore-image-navigator',
  imports: [TableModule, CommonModule, ButtonModule, PanelModule, SelectModule, FormsModule, ImageModule, ToastModule],
  providers: [MessageService],
  templateUrl: './fstore-image-navigator.html',
  styleUrl: './fstore-image-navigator.css'
})
export class FstoreImageNavigator implements OnInit {
  private route = inject(ActivatedRoute);
  private firestore = inject(Firestore);
  private messageService = inject(MessageService);

  movieId = signal<string | null>(null);
  images = signal<TmdbImage[]>([]);
  isLoading = signal(false);

  // Set per tracciare le immagini selezionate
  selectedImages = signal<Set<string>>(new Set());

  // Operazione selezionata per batch
  selectedOperation = signal<string | null>(null);
  batchOperations = [
    { label: 'Oscura', value: 'obscure' },
    { label: 'Rendi visibile', value: 'unobscure' }
  ];

  async ngOnInit(): Promise<void> {
    // Leggi il movieId dall'URL
    this.route.params.subscribe(async params => {
      const id = params['id'];
      if (id) {
        this.movieId.set(id);
        await this.loadImages(id);
      }
    });
  }

  async loadImages(movieId: string): Promise<void> {
    this.isLoading.set(true);
    try {
      const imagesCollection = collection(this.firestore, 'movies', movieId, 'images');
      const querySnapshot = await getDocs(imagesCollection);
      
      const imagesData: TmdbImage[] = [];
      querySnapshot.forEach((doc) => {
        imagesData.push({
          ...doc.data() as TmdbImage,
          // Aggiungi l'ID del documento per riferimento
          id: doc.id
        } as any);
      });

      this.images.set(imagesData);
      this.isLoading.set(false);
    } catch (error) {
      console.error('Error loading images from Firestore:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Errore',
        detail: 'Errore nel caricamento delle immagini da Firestore',
        life: 5000
      });
      this.isLoading.set(false);
    }
  }

  getImageUrl(filePath: string): string {
    // TMDB image base URL
    return `https://image.tmdb.org/t/p/w500${filePath}`;
  }

  isObscured(image: TmdbImage): boolean {
    return image.obscured === true;
  }

  async obscureImage(imageId: string): Promise<void> {
    const movieId = this.movieId();
    if (!movieId) return;

    try {
      const imageDoc = doc(this.firestore, 'movies', movieId, 'images', imageId);
      await updateDoc(imageDoc, {
        obscured: true
      });

      // Aggiorna lo stato locale
      this.images.update(images => 
        images.map(img => 
          (img as any).id === imageId ? { ...img, obscured: true } : img
        )
      );

      this.messageService.add({
        severity: 'success',
        summary: 'Successo',
        detail: 'Immagine oscurata con successo!',
        life: 3000
      });
    } catch (error) {
      console.error('Error obscuring image:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Errore',
        detail: 'Errore nell\'oscurare l\'immagine',
        life: 5000
      });
    }
  }

  async unobscureImage(imageId: string): Promise<void> {
    const movieId = this.movieId();
    if (!movieId) return;

    try {
      const imageDoc = doc(this.firestore, 'movies', movieId, 'images', imageId);
      await updateDoc(imageDoc, {
        obscured: false
      });

      // Aggiorna lo stato locale
      this.images.update(images => 
        images.map(img => 
          (img as any).id === imageId ? { ...img, obscured: false } : img
        )
      );

      this.messageService.add({
        severity: 'success',
        summary: 'Successo',
        detail: 'Immagine resa visibile con successo!',
        life: 3000
      });
    } catch (error) {
      console.error('Error unobscuring image:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Errore',
        detail: 'Errore nel rendere visibile l\'immagine',
        life: 5000
      });
    }
  }

  toggleImageSelection(imageId: string): void {
    this.selectedImages.update(set => {
      const newSet = new Set(set);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  }

  isImageSelected(imageId: string): boolean {
    return this.selectedImages().has(imageId);
  }

  toggleSelectAll(): void {
    const currentImageIds = this.images().map(img => (img as any).id);
    const allSelected = currentImageIds.every((id: string) => this.selectedImages().has(id));
    
    this.selectedImages.update(set => {
      const newSet = new Set(set);
      if (allSelected) {
        currentImageIds.forEach((id: string) => newSet.delete(id));
      } else {
        currentImageIds.forEach((id: string) => newSet.add(id));
      }
      return newSet;
    });
  }

  areAllSelected(): boolean {
    const currentImageIds = this.images().map(img => (img as any).id);
    return currentImageIds.length > 0 && currentImageIds.every((id: string) => this.selectedImages().has(id));
  }

  getSelectedCount(): number {
    return this.selectedImages().size;
  }

  async obscureSelectedImages(): Promise<void> {
    const selectedIds = Array.from(this.selectedImages());
    const movieId = this.movieId();
    if (!movieId || selectedIds.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Attenzione',
        detail: 'Nessuna immagine selezionata!',
        life: 3000
      });
      return;
    }

    if (!confirm(`Vuoi oscurare ${selectedIds.length} immagini selezionate?`)) {
      return;
    }

    this.isLoading.set(true);
    try {
      await Promise.all(
        selectedIds.map(id => {
          const imageDoc = doc(this.firestore, 'movies', movieId, 'images', id);
          return updateDoc(imageDoc, { obscured: true });
        })
      );

      // Aggiorna lo stato locale
      this.images.update(images => 
        images.map(img => 
          selectedIds.includes((img as any).id) ? { ...img, obscured: true } : img
        )
      );

      this.selectedImages.set(new Set());
      this.messageService.add({
        severity: 'success',
        summary: 'Successo',
        detail: `${selectedIds.length} immagini oscurate con successo!`,
        life: 3000
      });
    } catch (error) {
      console.error('Error obscuring images:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Errore',
        detail: 'Errore nell\'oscurare le immagini',
        life: 5000
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  async unobscureSelectedImages(): Promise<void> {
    const selectedIds = Array.from(this.selectedImages());
    const movieId = this.movieId();
    if (!movieId || selectedIds.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Attenzione',
        detail: 'Nessuna immagine selezionata!',
        life: 3000
      });
      return;
    }

    if (!confirm(`Vuoi rendere visibili ${selectedIds.length} immagini selezionate?`)) {
      return;
    }

    this.isLoading.set(true);
    try {
      await Promise.all(
        selectedIds.map(id => {
          const imageDoc = doc(this.firestore, 'movies', movieId, 'images', id);
          return updateDoc(imageDoc, { obscured: false });
        })
      );

      // Aggiorna lo stato locale
      this.images.update(images => 
        images.map(img => 
          selectedIds.includes((img as any).id) ? { ...img, obscured: false } : img
        )
      );

      this.selectedImages.set(new Set());
      this.messageService.add({
        severity: 'success',
        summary: 'Successo',
        detail: `${selectedIds.length} immagini rese visibili con successo!`,
        life: 3000
      });
    } catch (error) {
      console.error('Error unobscuring images:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Errore',
        detail: 'Errore nel rendere visibili le immagini',
        life: 5000
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  async applyBatchOperation(): Promise<void> {
    const operation = this.selectedOperation();
    if (!operation) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Attenzione',
        detail: 'Seleziona un\'operazione da eseguire!',
        life: 3000
      });
      return;
    }

    if (this.selectedImages().size === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Attenzione',
        detail: 'Nessuna immagine selezionata!',
        life: 3000
      });
      return;
    }

    switch (operation) {
      case 'obscure':
        await this.obscureSelectedImages();
        break;
      case 'unobscure':
        await this.unobscureSelectedImages();
        break;
    }
  }
}

