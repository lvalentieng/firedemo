import { inject, Injectable } from '@angular/core';
import { 
  Firestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy
} from '@angular/fire/firestore';
import { Movie } from '../models/movie-model';

@Injectable({
  providedIn: 'root'
})
export class MovieService {
  private firestore = inject(Firestore);
  private moviesCollection = collection(this.firestore, 'movies');

  // Ottieni tutti i movie
  async getAllMovies(): Promise<Movie[]> {
    const q = query(this.moviesCollection, orderBy('annoUscita', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Movie));
  }

  // Crea un nuovo movie
  async createMovie(movie: Omit<Movie, 'id'>): Promise<string> {
    const docRef = await addDoc(this.moviesCollection, movie);
    return docRef.id;
  }

  // Aggiorna un movie
  async updateMovie(id: string, movie: Partial<Omit<Movie, 'id'>>): Promise<void> {
    const movieDoc = doc(this.firestore, `movies/${id}`);
    await updateDoc(movieDoc, movie);
  }

  // Elimina un movie
  async deleteMovie(id: string): Promise<void> {
    const movieDoc = doc(this.firestore, `movies/${id}`);
    await deleteDoc(movieDoc);
  }
}
