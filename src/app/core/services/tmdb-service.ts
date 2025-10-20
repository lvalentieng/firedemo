import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TmdbResponse, TmdbImagesResponse } from '../models/tmdb-model';

@Injectable({
  providedIn: 'root'
})
export class TmdbService {
  private http = inject(HttpClient);
  private apiUrl = 'https://api.themoviedb.org/3';

  getTopRatedMovies(page: number = 1, language: string = 'it'): Observable<TmdbResponse> {
    const token = localStorage.getItem('TMDB_TOKEN');
    
    if (!token) {
      throw new Error('TMDB_TOKEN non trovato in localStorage');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const params = new HttpParams()
      .set('language', language)
      .set('page', (page+1).toString());

    return this.http.get<TmdbResponse>(
      `${this.apiUrl}/movie/top_rated`,
      { headers, params }
    );
  }

  searchMovies(query: string, page: number = 1, language: string = 'it'): Observable<TmdbResponse> {
    const token = localStorage.getItem('TMDB_TOKEN');
    
    if (!token) {
      throw new Error('TMDB_TOKEN non trovato in localStorage');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const params = new HttpParams()
      .set('query', query)
      .set('include_adult', 'false')
      .set('language', language)
      .set('page', (page+1).toString());

    return this.http.get<TmdbResponse>(
      `${this.apiUrl}/search/movie`,
      { headers, params }
    );
  }

  getMovieImages(movieId: number): Observable<TmdbImagesResponse> {
    const token = localStorage.getItem('TMDB_TOKEN');
    
    if (!token) {
      throw new Error('TMDB_TOKEN non trovato in localStorage');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'accept': 'application/json'
    });

    return this.http.get<TmdbImagesResponse>(
      `${this.apiUrl}/movie/${movieId}/images`,
      { headers }
    );
  }

  
}