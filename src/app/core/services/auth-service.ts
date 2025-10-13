import { Injectable, signal } from '@angular/core';
import {
  Auth,
  browserSessionPersistence,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  user,
  User,
} from '@angular/fire/auth';
import { setPersistence } from 'firebase/auth';
import { from, Observable, of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  user$: Observable<User | null>;

  // Signals per lo stato dell'utente e il ruolo
  readonly currentUserRole = signal<'admin' | 'user' | null>(null);
  readonly isAuthenticated = signal<boolean>(false);

  constructor(private firebaseAuth: Auth) {
    this.setSessionStoragePersistence();
    this.user$ = user(this.firebaseAuth);
    
    // Monitora i cambiamenti di autenticazione e leggi i custom claims
    this.user$.pipe(
      switchMap(firebaseUser => {
        if (!firebaseUser) {
          return of(null);
        }
        // Ottieni il token con i custom claims
        return from(firebaseUser.getIdTokenResult());
      })
    ).subscribe(tokenResult => {
      if (tokenResult) {
        const role = tokenResult.claims['role'] as 'admin' | 'user' | undefined;
        this.currentUserRole.set(role || null);
        this.isAuthenticated.set(true);
      } else {
        this.currentUserRole.set(null);
        this.isAuthenticated.set(false);
      }
    });
  }

  private setSessionStoragePersistence(): void {
    setPersistence(this.firebaseAuth, browserSessionPersistence);
  }

  async googleLogin(): Promise<void> {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(this.firebaseAuth, provider);
      const user = result.user;
      if (!user) {
        throw new Error('Google-Login error');
      }
      // Forza il refresh del token per ottenere i claims aggiornati
      await user.getIdToken(true);
    } catch (error) {
      console.error('Google-Login error:', error);
      throw error;
    }
  }

  logout(): Observable<void> {
    const promise = signOut(this.firebaseAuth).then(() => {
      sessionStorage.clear();
    });
    return from(promise);
  }

  // Metodi helper per verificare i ruoli
  isAdmin(): boolean {
    return this.currentUserRole() === 'admin';
  }

  isUser(): boolean {
    return this.currentUserRole() === 'user';
  }

  hasRole(): boolean {
    return this.currentUserRole() !== null;
  }

  // Observable per il ruolo (utile per i guards)
  getRole$(): Observable<'admin' | 'user' | null> {
    return this.user$.pipe(
      switchMap(firebaseUser => {
        if (!firebaseUser) return of(null);
        return from(firebaseUser.getIdTokenResult());
      }),
      map(tokenResult => {
        if (!tokenResult) return null;
        return tokenResult.claims['role'] as 'admin' | 'user' | null;
      })
    );
  }

}
