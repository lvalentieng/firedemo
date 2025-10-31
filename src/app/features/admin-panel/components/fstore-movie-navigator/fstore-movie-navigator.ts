import { Component, inject, OnInit, signal } from '@angular/core';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { TmdbMovie } from '../../../../core/models/tmdb-model';
import { PaginatorModule } from 'primeng/paginator';
import { Firestore, collection, query, getDocs, limit, startAfter, orderBy, Query, DocumentData, QueryDocumentSnapshot, getCountFromServer, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from '@angular/fire/firestore';
import { ButtonModule } from 'primeng/button';
import { PanelModule } from 'primeng/panel';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-fstore-movie-navigator',
  imports: [TableModule, CommonModule, PaginatorModule, ButtonModule, PanelModule, SelectModule, FormsModule, RouterLink, ToastModule],
  templateUrl: './fstore-movie-navigator.html',
  styleUrl: './fstore-movie-navigator.css',
  providers: [MessageService]
})
export class FstoreMovieNavigator implements OnInit {
  private firestore = inject(Firestore);
  private messageService = inject(MessageService);

  movies = signal<TmdbMovie[]>([]);
  isLoading = signal(false);
  currentPage = signal(0);
  firstElementPage = signal(0);
  totalResults = signal(0);
  pageSize = 20;

  // Per la paginazione di Firestore
  private lastVisibleDocs: Map<number, QueryDocumentSnapshot<DocumentData>> = new Map();

  // Set per tracciare lo stato dei film
  excludedMovies = signal<Set<number>>(new Set());
  markedMovies = signal<Set<number>>(new Set());

  // Set per tracciare i film selezionati
  selectedMovies = signal<Set<number>>(new Set());

  // Operazione selezionata per batch
  selectedOperation = signal<string | null>(null);
  batchOperations = [
    { label: 'Escludi', value: 'exclude' },
    { label: 'Includi', value: 'include' },
    { label: 'Marca', value: 'mark' },
    { label: 'Demarca', value: 'unmark' }
  ];

  async ngOnInit(): Promise<void> {
    await this.loadAllMoviesStatus();
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

      // Verifica e sincronizza i metadata
      await this.syncMoviesWithMetadata(moviesData);

      this.isLoading.set(false);
    } catch (error) {
      console.error('Error loading movies from Firestore:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Errore',
        detail: 'Errore nel caricamento dei film da Firestore',
        life: 5000
      });
      this.isLoading.set(false);
    }
  }

  onPageChange(event: any): void {
    console.debug('FstoreMovieNavigator - onPageChange():', event);

    const pageToShow = event.rows != this.pageSize ? 0 : event.page;
    this.currentPage.set(pageToShow || 0);

    this.firstElementPage.set(event.first ?? 0);

    // Reset della selezione quando si cambia pagina
    this.selectedMovies.set(new Set());

    this.loadMovies(this.currentPage());
  }

  async loadAllMoviesStatus(): Promise<void> {
    try {
      const metadataRef = doc(this.firestore, 'metadata', 'movie-status');
      const metadataSnap = await getDoc(metadataRef);
      
      if (metadataSnap.exists()) {
        const data = metadataSnap.data();
        this.excludedMovies.set(new Set(data['excluded'] || []));
        this.markedMovies.set(new Set(data['marked'] || []));
      }
    } catch (error) {
      console.error('Error loading movies status:', error);
    }
  }

  async syncMoviesWithMetadata(movies: TmdbMovie[]): Promise<void> {
    if (movies.length === 0) return;

    try {
      const metadataRef = doc(this.firestore, 'metadata', 'movie-status');
      const metadataSnap = await getDoc(metadataRef);
      
      let currentImported: number[] = [];
      let currentExcluded: number[] = [];
      let currentMarked: number[] = [];
      
      if (metadataSnap.exists()) {
        const data = metadataSnap.data();
        currentImported = data['imported'] || [];
        currentExcluded = data['excluded'] || [];
        currentMarked = data['marked'] || [];
      }
      
      // Trova i movie ID che non sono presenti in "imported"
      const movieIds = movies.map(m => m.id);
      const missingIds = movieIds.filter(id => !currentImported.includes(id));
      
      if (missingIds.length > 0) {
        console.log(`Trovati ${missingIds.length} film non sincronizzati nei metadata. Aggiorno...`);
        
        // Aggiungi i movie ID mancanti all'array imported
        const updatedImported = [...new Set([...currentImported, ...missingIds])];
        
        await setDoc(metadataRef, {
          imported: updatedImported,
          excluded: currentExcluded,
          marked: currentMarked
        });
        
        console.log('Metadata sincronizzati con successo!');
      }
    } catch (error) {
      console.error('Error syncing movies with metadata:', error);
    }
  }

  async excludeMovie(movieId: number): Promise<void> {
    try {
      const metadataRef = doc(this.firestore, 'metadata', 'movie-status');
      await updateDoc(metadataRef, {
        excluded: arrayUnion(movieId)
      }).catch(async () => {
        await setDoc(metadataRef, {
          imported: [],
          excluded: [movieId],
          marked: []
        });
      });
      
      this.excludedMovies.update(set => {
        const newSet = new Set(set);
        newSet.add(movieId);
        return newSet;
      });
      
      this.messageService.add({
        severity: 'success',
        summary: 'Successo',
        detail: `Film ID ${movieId} escluso con successo!`,
        life: 3000
      });
    } catch (error) {
      console.error('Error excluding movie:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Errore',
        detail: 'Errore nell\'esclusione del film',
        life: 5000
      });
    }
  }

  async includeMovie(movieId: number): Promise<void> {
    try {
      const metadataRef = doc(this.firestore, 'metadata', 'movie-status');
      await updateDoc(metadataRef, {
        excluded: arrayRemove(movieId)
      });
      
      this.excludedMovies.update(set => {
        const newSet = new Set(set);
        newSet.delete(movieId);
        return newSet;
      });
      
      this.messageService.add({
        severity: 'success',
        summary: 'Successo',
        detail: `Film ID ${movieId} incluso con successo!`,
        life: 3000
      });
    } catch (error) {
      console.error('Error including movie:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Errore',
        detail: 'Errore nell\'inclusione del film',
        life: 5000
      });
    }
  }

  async markAsReviewed(movieId: number): Promise<void> {
    try {
      const metadataRef = doc(this.firestore, 'metadata', 'movie-status');
      await updateDoc(metadataRef, {
        marked: arrayUnion(movieId)
      }).catch(async () => {
        await setDoc(metadataRef, {
          imported: [],
          excluded: [],
          marked: [movieId]
        });
      });
      
      this.markedMovies.update(set => {
        const newSet = new Set(set);
        newSet.add(movieId);
        return newSet;
      });
      
      this.messageService.add({
        severity: 'success',
        summary: 'Successo',
        detail: `Film ID ${movieId} marcato come revisionato!`,
        life: 3000
      });
    } catch (error) {
      console.error('Error marking movie as reviewed:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Errore',
        detail: 'Errore nel marcare il film',
        life: 5000
      });
    }
  }

  async unmarkMovie(movieId: number): Promise<void> {
    try {
      const metadataRef = doc(this.firestore, 'metadata', 'movie-status');
      await updateDoc(metadataRef, {
        marked: arrayRemove(movieId)
      });
      
      this.markedMovies.update(set => {
        const newSet = new Set(set);
        newSet.delete(movieId);
        return newSet;
      });
      
      this.messageService.add({
        severity: 'success',
        summary: 'Successo',
        detail: `Film ID ${movieId} demarcato con successo!`,
        life: 3000
      });
    } catch (error) {
      console.error('Error unmarking movie:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Errore',
        detail: 'Errore nel demarcare il film',
        life: 5000
      });
    }
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
        currentMovieIds.forEach(id => newSet.delete(id));
      } else {
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

  async excludeSelectedMovies(): Promise<void> {
    const selectedIds = Array.from(this.selectedMovies());
    if (selectedIds.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Attenzione',
        detail: 'Nessun film selezionato!',
        life: 3000
      });
      return;
    }

    if (!confirm(`Vuoi escludere ${selectedIds.length} film selezionati?`)) {
      return;
    }

    this.isLoading.set(true);
    try {
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

      this.excludedMovies.update(set => {
        const newSet = new Set(set);
        selectedIds.forEach(id => newSet.add(id));
        return newSet;
      });

      this.selectedMovies.set(new Set());
      this.messageService.add({
        severity: 'success',
        summary: 'Successo',
        detail: `${selectedIds.length} film esclusi con successo!`,
        life: 3000
      });
    } catch (error) {
      console.error('Error excluding movies:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Errore',
        detail: 'Errore nell\'esclusione dei film',
        life: 5000
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  async includeSelectedMovies(): Promise<void> {
    const selectedIds = Array.from(this.selectedMovies());
    if (selectedIds.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Attenzione',
        detail: 'Nessun film selezionato!',
        life: 3000
      });
      return;
    }

    if (!confirm(`Vuoi includere ${selectedIds.length} film selezionati?`)) {
      return;
    }

    this.isLoading.set(true);
    try {
      const metadataRef = doc(this.firestore, 'metadata', 'movie-status');
      const metadataSnap = await getDoc(metadataRef);
      if (metadataSnap.exists()) {
        const currentData = metadataSnap.data();
        const updatedExcluded = (currentData['excluded'] || []).filter((id: number) => !selectedIds.includes(id));
        await updateDoc(metadataRef, {
          excluded: updatedExcluded
        });
      }

      this.excludedMovies.update(set => {
        const newSet = new Set(set);
        selectedIds.forEach(id => newSet.delete(id));
        return newSet;
      });

      this.selectedMovies.set(new Set());
      this.messageService.add({
        severity: 'success',
        summary: 'Successo',
        detail: `${selectedIds.length} film inclusi con successo!`,
        life: 3000
      });
    } catch (error) {
      console.error('Error including movies:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Errore',
        detail: 'Errore nell\'inclusione dei film',
        life: 5000
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  async markSelectedAsReviewed(): Promise<void> {
    const selectedIds = Array.from(this.selectedMovies());
    if (selectedIds.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Attenzione',
        detail: 'Nessun film selezionato!',
        life: 3000
      });
      return;
    }

    if (!confirm(`Vuoi marcare come revisionati ${selectedIds.length} film selezionati?`)) {
      return;
    }

    this.isLoading.set(true);
    try {
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

      this.markedMovies.update(set => {
        const newSet = new Set(set);
        selectedIds.forEach(id => newSet.add(id));
        return newSet;
      });

      this.selectedMovies.set(new Set());
      this.messageService.add({
        severity: 'success',
        summary: 'Successo',
        detail: `${selectedIds.length} film marcati come revisionati!`,
        life: 3000
      });
    } catch (error) {
      console.error('Error marking movies as reviewed:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Errore',
        detail: 'Errore nel marcare i film',
        life: 5000
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  async unmarkSelectedMovies(): Promise<void> {
    const selectedIds = Array.from(this.selectedMovies());
    if (selectedIds.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Attenzione',
        detail: 'Nessun film selezionato!',
        life: 3000
      });
      return;
    }

    if (!confirm(`Vuoi demarcare ${selectedIds.length} film selezionati?`)) {
      return;
    }

    this.isLoading.set(true);
    try {
      const metadataRef = doc(this.firestore, 'metadata', 'movie-status');
      const metadataSnap = await getDoc(metadataRef);
      if (metadataSnap.exists()) {
        const currentData = metadataSnap.data();
        const updatedMarked = (currentData['marked'] || []).filter((id: number) => !selectedIds.includes(id));
        await updateDoc(metadataRef, {
          marked: updatedMarked
        });
      }

      this.markedMovies.update(set => {
        const newSet = new Set(set);
        selectedIds.forEach(id => newSet.delete(id));
        return newSet;
      });

      this.selectedMovies.set(new Set());
      this.messageService.add({
        severity: 'success',
        summary: 'Successo',
        detail: `${selectedIds.length} film demarcati con successo!`,
        life: 3000
      });
    } catch (error) {
      console.error('Error unmarking movies:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Errore',
        detail: 'Errore nel demarcare i film',
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

    if (this.selectedMovies().size === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Attenzione',
        detail: 'Nessun film selezionato!',
        life: 3000
      });
      return;
    }

    switch (operation) {
      case 'exclude':
        await this.excludeSelectedMovies();
        break;
      case 'include':
        await this.includeSelectedMovies();
        break;
      case 'mark':
        await this.markSelectedAsReviewed();
        break;
      case 'unmark':
        await this.unmarkSelectedMovies();
        break;
    }
  }
}
