import { Component, inject, OnInit, signal } from '@angular/core';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { TmdbMovie } from '../../../../core/models/tmdb-model';
import { PaginatorModule } from 'primeng/paginator';
import { Firestore, collection, query, getDocs, limit, startAfter, orderBy, Query, DocumentData, QueryDocumentSnapshot, getCountFromServer } from '@angular/fire/firestore';
import { ButtonModule } from 'primeng/button';
import { PanelModule } from 'primeng/panel';

@Component({
  selector: 'app-fstore-movie-navigator',
  imports: [TableModule, CommonModule, PaginatorModule, ButtonModule, PanelModule],
  templateUrl: './fstore-movie-navigator.html',
  styleUrl: './fstore-movie-navigator.css'
})
export class FstoreMovieNavigator implements OnInit {
  private firestore = inject(Firestore);

  movies = signal<TmdbMovie[]>([]);
  isLoading = signal(false);
  currentPage = signal(0);
  firstElementPage = signal(0);
  totalResults = signal(0);
  pageSize = 20;

  // Per la paginazione di Firestore
  private lastVisibleDocs: Map<number, QueryDocumentSnapshot<DocumentData>> = new Map();

  async ngOnInit(): Promise<void> {
    await this.loadTotalCount();
    await this.loadMovies(0);
  }

  async loadTotalCount(): Promise<void> {
    try {
      const moviesCollection = collection(this.firestore, 'movies');
      const snapshot = await getCountFromServer(moviesCollection);
      this.totalResults.set(snapshot.data().count);
    } catch (error) {
      console.error('Error loading total count:', error);
    }
  }

  async loadMovies(page: number): Promise<void> {
    this.isLoading.set(true);
    try {
      const moviesCollection = collection(this.firestore, 'movies');
      let q: Query<DocumentData>;

      if (page === 0) {
        // Prima pagina
        q = query(
          moviesCollection,
          orderBy('importedAt', 'asc'),
          limit(this.pageSize)
        );
        this.lastVisibleDocs.clear();
      } else {
        // Pagine successive
        const lastDoc = this.lastVisibleDocs.get(page - 1);
        if (!lastDoc) {
          console.error('No last document found for pagination');
          this.isLoading.set(false);
          return;
        }
        q = query(
          moviesCollection,
          orderBy('importedAt', 'asc'),
          startAfter(lastDoc),
          limit(this.pageSize)
        );
      }

      const querySnapshot = await getDocs(q);
      const moviesData: TmdbMovie[] = [];

      querySnapshot.forEach((doc) => {
        moviesData.push(doc.data() as TmdbMovie);
      });

      // Salva l'ultimo documento visibile per la paginazione
      if (!querySnapshot.empty) {
        this.lastVisibleDocs.set(page, querySnapshot.docs[querySnapshot.docs.length - 1]);
      }

      this.movies.set(moviesData);
      this.currentPage.set(page);

      if (page === 0) {
        this.firstElementPage.set(0);
      }

      this.isLoading.set(false);
    } catch (error) {
      console.error('Error loading movies from Firestore:', error);
      alert('Errore nel caricamento dei film da Firestore: ' + error);
      this.isLoading.set(false);
    }
  }

  onPageChange(event: any): void {
    console.debug('FstoreMovieNavigator - onPageChange():', event);

    const pageToShow = event.rows != this.pageSize ? 0 : event.page;
    this.currentPage.set(pageToShow || 0);

    this.firstElementPage.set(event.first ?? 0);

    this.loadMovies(this.currentPage());
  }
}
