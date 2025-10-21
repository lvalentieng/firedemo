import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { TmdbImage } from '../../../../core/models/tmdb-model';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { ButtonModule } from 'primeng/button';
import { PanelModule } from 'primeng/panel';

@Component({
  selector: 'app-fstore-image-navigator',
  imports: [TableModule, CommonModule, ButtonModule, PanelModule],
  templateUrl: './fstore-image-navigator.html',
  styleUrl: './fstore-image-navigator.css'
})
export class FstoreImageNavigator implements OnInit {
  private route = inject(ActivatedRoute);
  private firestore = inject(Firestore);

  movieId = signal<string | null>(null);
  images = signal<TmdbImage[]>([]);
  isLoading = signal(false);

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
      alert('Errore nel caricamento delle immagini da Firestore: ' + error);
      this.isLoading.set(false);
    }
  }

  getImageUrl(filePath: string): string {
    // TMDB image base URL
    return `https://image.tmdb.org/t/p/w500${filePath}`;
  }
}

