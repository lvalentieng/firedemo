import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MovieService } from '../../../core/services/movie-service';
import { Movie } from '../../../core/models/movie-model';

@Component({
  selector: 'app-movie-crud',
  imports: [FormsModule],
  templateUrl: './movie-crud.html',
  styleUrl: './movie-crud.css'
})
export class MovieCrud implements OnInit {
  private movieService = inject(MovieService);

  movies = signal<Movie[]>([]);
  isLoading = signal(false);

  // Form per creazione/modifica
  isEditing = signal(false);
  editingId = signal<string | null>(null);
  formTitolo = signal('');
  formAnnoUscita = signal<number>(new Date().getFullYear());

  async ngOnInit(): Promise<void> {
    await this.loadMovies();
  }

  async loadMovies(): Promise<void> {
    this.isLoading.set(true);
    try {
      const moviesData = await this.movieService.getAllMovies();
      this.movies.set(moviesData);
    } catch (error) {
      console.error('Error loading movies:', error);
      alert('Errore nel caricamento dei film: ' + error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async createMovie(): Promise<void> {
    if (!this.formTitolo().trim()) {
      alert('Inserisci un titolo');
      return;
    }

    try {
      await this.movieService.createMovie({
        titolo: this.formTitolo(),
        annoUscita: this.formAnnoUscita()
      });
      this.resetForm();
      await this.loadMovies();
    } catch (error) {
      console.error('Error creating movie:', error);
      alert('Errore nella creazione del film: ' + error);
    }
  }

  editMovie(movie: Movie): void {
    this.isEditing.set(true);
    this.editingId.set(movie.id);
    this.formTitolo.set(movie.titolo);
    this.formAnnoUscita.set(movie.annoUscita);
  }

  async updateMovie(): Promise<void> {
    const id = this.editingId();
    if (!id) return;

    if (!this.formTitolo().trim()) {
      alert('Inserisci un titolo');
      return;
    }

    try {
      await this.movieService.updateMovie(id, {
        titolo: this.formTitolo(),
        annoUscita: this.formAnnoUscita()
      });
      this.resetForm();
      await this.loadMovies();
    } catch (error) {
      console.error('Error updating movie:', error);
      alert('Errore nell\'aggiornamento del film: ' + error);
    }
  }

  async deleteMovie(id: string): Promise<void> {
    if (!confirm('Sei sicuro di voler eliminare questo film?')) {
      return;
    }

    try {
      await this.movieService.deleteMovie(id);
      await this.loadMovies();
    } catch (error) {
      console.error('Error deleting movie:', error);
      alert('Errore nell\'eliminazione del film: ' + error);
    }
  }

  cancelEdit(): void {
    this.resetForm();
  }

  private resetForm(): void {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.formTitolo.set('');
    this.formAnnoUscita.set(new Date().getFullYear());
  }
}
