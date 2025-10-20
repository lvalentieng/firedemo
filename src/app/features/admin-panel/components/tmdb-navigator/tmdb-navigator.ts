import { Component, inject, OnInit, signal } from '@angular/core';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { TmdbMovie } from '../../../../core/models/tmdb-model';
import { TmdbService } from '../../../../core/services/tmdb-service';
import { PaginatorModule } from 'primeng/paginator';

@Component({
  selector: 'app-tmdb-navigator',
  imports: [TableModule, CommonModule, PaginatorModule],
  templateUrl: './tmdb-navigator.html',
  styleUrl: './tmdb-navigator.css'
})
export class TmdbNavigator implements OnInit {
  private tmdbService = inject(TmdbService);

  firstElementPage = signal(0);

  movies = signal<TmdbMovie[]>([]);
  isLoading = signal(false);
  currentPage = signal(0);
  totalPages = signal(0);
  totalResults = signal(0);
  hasLoaded = signal(false);

  async ngOnInit(): Promise<void> {
    await this.loadMovies(0);
  }

  async loadMovies(page: number): Promise<void> {
    this.isLoading.set(true);
    try {
      this.tmdbService.getTopRatedMovies(page).subscribe({
        next: (response) => {
          this.movies.set(response.results);
          this.currentPage.set(response.page);
          this.totalPages.set(response.total_pages);
          this.totalResults.set(response.total_results);
          this.hasLoaded.set(true);

          if (page === 0) {
            this.firstElementPage.set(0);
          }

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
}
