import { Component, inject, OnInit, signal } from '@angular/core';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { TmdbMovie } from '../../../../core/models/tmdb-model';
import { TmdbService } from '../../../../core/services/tmdb-service';
import { PaginatorModule } from 'primeng/paginator';
import { Firestore, collection, addDoc, doc, setDoc, getDoc, updateDoc, arrayUnion } from '@angular/fire/firestore';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-tmdb-navigator',
  imports: [TableModule, CommonModule, PaginatorModule, ButtonModule],
  templateUrl: './tmdb-navigator.html',
  styleUrl: './tmdb-navigator.css'
})
export class TmdbNavigator implements OnInit {
  private tmdbService = inject(TmdbService);
  private firestore = inject(Firestore);

  firstElementPage = signal(0);

  movies = signal<TmdbMovie[]>([]);
  isLoading = signal(false);
  currentPage = signal(0);
  totalPages = signal(0);
  totalResults = signal(0);
  hasLoaded = signal(false);

  // Set per tracciare lo stato dei film
  importedMovies = signal<Set<number>>(new Set());
  excludedMovies = signal<Set<number>>(new Set());
  markedMovies = signal<Set<number>>(new Set());

  // Set per tracciare i film selezionati
  selectedMovies = signal<Set<number>>(new Set());

  async ngOnInit(): Promise<void> {
    // Carica prima lo stato globale dei film
    await this.loadAllMoviesStatus();
    // Poi carica i film della prima pagina
    await this.loadMovies(0);
  }

  async loadMovies(page: number): Promise<void> {
    this.isLoading.set(true);
    try {
      this.tmdbService.getTopRatedMovies(page).subscribe({
        next: async (response) => {
          this.movies.set(response.results);
          this.currentPage.set(response.page);
          this.totalPages.set(response.total_pages);
          this.totalResults.set(response.total_results);
          this.hasLoaded.set(true);

          if (page === 0) {
            this.firstElementPage.set(0);
          }

          // Non serve più caricare lo stato per ogni pagina
          // await this.loadMoviesStatus(response.results);

          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading movies:', error);
          alert('Errore nel caricamento dei film: ' + error.message);
          this.isLoading.set(false);
        }
      });
    } catch (error) {
      console.error('Error loading movies:', error);
      alert('Errore nel caricamento dei film. Verifica che TMDB_TOKEN sia impostato in localStorage.');
      this.isLoading.set(false);
    }
  }

  onPageChange(event: any): void {
    console.debug('PlansHistoryComponent - onPageChange():', event);

    const pageToShow = event.rows != 20 ? 0 : event.page;
    this.currentPage.set(pageToShow || 0);

    this.firstElementPage.set(event.first ?? 0);

    this.loadMovies(this.currentPage());
  }

  async importMovie(movie: TmdbMovie): Promise<void> {
    try {
      // Importa il film TMDB completo nella collection /movies usando il suo ID come document ID
      const movieDoc = doc(this.firestore, 'movies', movie.id.toString());
      await setDoc(movieDoc, {
        ...movie,
        importedAt: new Date()
      });
      
      // Aggiorna l'indice aggregato
      const metadataRef = doc(this.firestore, 'metadata', 'movie-status');
      await updateDoc(metadataRef, {
        imported: arrayUnion(movie.id)
      }).catch(async () => {
        // Se il documento non esiste, crealo
        await setDoc(metadataRef, {
          imported: [movie.id],
          excluded: [],
          marked: []
        });
      });
      
      // Aggiorna lo stato locale
      this.importedMovies.update(set => {
        const newSet = new Set(set);
        newSet.add(movie.id);
        return newSet;
      });
      
      alert(`Film "${movie.title}" importato con successo!`);
    } catch (error) {
      console.error('Error importing movie:', error);
      alert('Errore nell\'importazione del film: ' + error);
    }
  }

  async excludeMovie(movieId: number): Promise<void> {
    try {
      // SOLO aggiorna l'indice aggregato
      const metadataRef = doc(this.firestore, 'metadata', 'movie-status');
      await updateDoc(metadataRef, {
        excluded: arrayUnion(movieId)
      }).catch(async () => {
        // Se il documento non esiste, crealo
        await setDoc(metadataRef, {
          imported: [],
          excluded: [movieId],
          marked: []
        });
      });
      
      // Aggiorna lo stato locale
      this.excludedMovies.update(set => {
        const newSet = new Set(set);
        newSet.add(movieId);
        return newSet;
      });
      
      alert(`Film ID ${movieId} escluso con successo!`);
    } catch (error) {
      console.error('Error excluding movie:', error);
      alert('Errore nell\'esclusione del film: ' + error);
    }
  }

  async markAsReviewed(movieId: number): Promise<void> {
    try {
      // SOLO aggiorna l'indice aggregato
      const metadataRef = doc(this.firestore, 'metadata', 'movie-status');
      await updateDoc(metadataRef, {
        marked: arrayUnion(movieId)
      }).catch(async () => {
        // Se il documento non esiste, crealo
        await setDoc(metadataRef, {
          imported: [],
          excluded: [],
          marked: [movieId]
        });
      });
      
      // Aggiorna lo stato locale
      this.markedMovies.update(set => {
        const newSet = new Set(set);
        newSet.add(movieId);
        return newSet;
      });
      
      alert(`Film ID ${movieId} marcato come revisionato!`);
    } catch (error) {
      console.error('Error marking movie as reviewed:', error);
      alert('Errore nel marcare il film: ' + error);
    }
  }

  async loadAllMoviesStatus(): Promise<void> {
    try {
      const metadataRef = doc(this.firestore, 'metadata', 'movie-status');
      const metadataSnap = await getDoc(metadataRef);
      
      if (metadataSnap.exists()) {
        const data = metadataSnap.data();
        this.importedMovies.set(new Set(data['imported'] || []));
        this.excludedMovies.set(new Set(data['excluded'] || []));
        this.markedMovies.set(new Set(data['marked'] || []));
      } else {
        // Crea il documento se non esiste
        await setDoc(metadataRef, {
          imported: [],
          excluded: [],
          marked: []
        });
      }
    } catch (error) {
      console.error('Error loading movies status:', error);
    }
  }

  async loadMoviesStatus(movies: TmdbMovie[]): Promise<void> {
    // Non più necessario - rimosso per efficienza
    // Lo stato viene caricato una sola volta in loadAllMoviesStatus()
  }

  async checkMoviesInCollection(collectionName: string, movieIds: number[]): Promise<Set<number>> {
    // Non più necessario - rimosso per efficienza
    // Lo stato viene caricato dall'indice aggregato
    return new Set<number>();
  }

  isImported(movieId: number): boolean {
    return this.importedMovies().has(movieId);
  }

  isExcluded(movieId: number): boolean {
    return this.excludedMovies().has(movieId);
  }

  isMarked(movieId: number): boolean {
    return this.markedMovies().has(movieId);
  }

  toggleMovieSelection(movieId: number): void {
    this.selectedMovies.update(set => {
      const newSet = new Set(set);
      if (newSet.has(movieId)) {
        newSet.delete(movieId);
      } else {
        newSet.add(movieId);
      }
      return newSet;
    });
  }

  isMovieSelected(movieId: number): boolean {
    return this.selectedMovies().has(movieId);
  }

  toggleSelectAll(): void {
    const currentMovieIds = this.movies().map(m => m.id);
    const allSelected = currentMovieIds.every(id => this.selectedMovies().has(id));
    
    this.selectedMovies.update(set => {
      const newSet = new Set(set);
      if (allSelected) {
        // Deseleziona tutti i film della pagina corrente
        currentMovieIds.forEach(id => newSet.delete(id));
      } else {
        // Seleziona tutti i film della pagina corrente
        currentMovieIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  }

  areAllSelected(): boolean {
    const currentMovieIds = this.movies().map(m => m.id);
    return currentMovieIds.length > 0 && currentMovieIds.every(id => this.selectedMovies().has(id));
  }

  getSelectedCount(): number {
    return this.selectedMovies().size;
  }

  async importSelectedMovies(): Promise<void> {
    const selectedIds = Array.from(this.selectedMovies());
    if (selectedIds.length === 0) {
      alert('Nessun film selezionato!');
      return;
    }

    if (!confirm(`Vuoi importare ${selectedIds.length} film selezionati?`)) {
      return;
    }

    this.isLoading.set(true);
    try {
      const selectedMoviesData = this.movies().filter(m => selectedIds.includes(m.id));
      
      // Importa tutti i film in parallelo
      await Promise.all(
        selectedMoviesData.map(movie => 
          setDoc(doc(this.firestore, 'movies', movie.id.toString()), {
            ...movie,
            importedAt: new Date()
          })
        )
      );

      // Aggiorna l'indice aggregato con tutti gli ID
      const metadataRef = doc(this.firestore, 'metadata', 'movie-status');
      await updateDoc(metadataRef, {
        imported: arrayUnion(...selectedIds)
      }).catch(async () => {
        const metadataSnap = await getDoc(metadataRef);
        const currentData = metadataSnap.exists() ? metadataSnap.data() : { imported: [], excluded: [], marked: [] };
        await setDoc(metadataRef, {
          ...currentData,
          imported: [...new Set([...(currentData['imported'] || []), ...selectedIds])]
        });
      });

      // Aggiorna lo stato locale
      this.importedMovies.update(set => {
        const newSet = new Set(set);
        selectedIds.forEach(id => newSet.add(id));
        return newSet;
      });

      // Pulisci la selezione
      this.selectedMovies.set(new Set());

      alert(`${selectedIds.length} film importati con successo!`);
    } catch (error) {
      console.error('Error importing movies:', error);
      alert('Errore nell\'importazione dei film: ' + error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async excludeSelectedMovies(): Promise<void> {
    const selectedIds = Array.from(this.selectedMovies());
    if (selectedIds.length === 0) {
      alert('Nessun film selezionato!');
      return;
    }

    if (!confirm(`Vuoi escludere ${selectedIds.length} film selezionati?`)) {
      return;
    }

    this.isLoading.set(true);
    try {
      // Aggiorna l'indice aggregato con tutti gli ID
      const metadataRef = doc(this.firestore, 'metadata', 'movie-status');
      await updateDoc(metadataRef, {
        excluded: arrayUnion(...selectedIds)
      }).catch(async () => {
        const metadataSnap = await getDoc(metadataRef);
        const currentData = metadataSnap.exists() ? metadataSnap.data() : { imported: [], excluded: [], marked: [] };
        await setDoc(metadataRef, {
          ...currentData,
          excluded: [...new Set([...(currentData['excluded'] || []), ...selectedIds])]
        });
      });

      // Aggiorna lo stato locale
      this.excludedMovies.update(set => {
        const newSet = new Set(set);
        selectedIds.forEach(id => newSet.add(id));
        return newSet;
      });

      // Pulisci la selezione
      this.selectedMovies.set(new Set());

      alert(`${selectedIds.length} film esclusi con successo!`);
    } catch (error) {
      console.error('Error excluding movies:', error);
      alert('Errore nell\'esclusione dei film: ' + error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async markSelectedAsReviewed(): Promise<void> {
    const selectedIds = Array.from(this.selectedMovies());
    if (selectedIds.length === 0) {
      alert('Nessun film selezionato!');
      return;
    }

    if (!confirm(`Vuoi marcare come revisionati ${selectedIds.length} film selezionati?`)) {
      return;
    }

    this.isLoading.set(true);
    try {
      // Aggiorna l'indice aggregato con tutti gli ID
      const metadataRef = doc(this.firestore, 'metadata', 'movie-status');
      await updateDoc(metadataRef, {
        marked: arrayUnion(...selectedIds)
      }).catch(async () => {
        const metadataSnap = await getDoc(metadataRef);
        const currentData = metadataSnap.exists() ? metadataSnap.data() : { imported: [], excluded: [], marked: [] };
        await setDoc(metadataRef, {
          ...currentData,
          marked: [...new Set([...(currentData['marked'] || []), ...selectedIds])]
        });
      });

      // Aggiorna lo stato locale
      this.markedMovies.update(set => {
        const newSet = new Set(set);
        selectedIds.forEach(id => newSet.add(id));
        return newSet;
      });

      // Pulisci la selezione
      this.selectedMovies.set(new Set());

      alert(`${selectedIds.length} film marcati come revisionati!`);
    } catch (error) {
      console.error('Error marking movies as reviewed:', error);
      alert('Errore nel marcare i film: ' + error);
    } finally {
      this.isLoading.set(false);
    }
  }
}
