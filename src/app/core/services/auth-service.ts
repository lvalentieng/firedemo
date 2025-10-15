import { Injectable, signal } from '@angular/core';
import {
  Auth,
  browserSessionPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  user,
  User,
} from '@angular/fire/auth';
import { setPersistence, UserCredential } from 'firebase/auth';
import { from, Observable, of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  user$: Observable<User | null>;

  constructor(private firebaseAuth: Auth) {
    this.setSessionStoragePersistence();
    this.user$ = user(this.firebaseAuth);
  }

  private setSessionStoragePersistence(): void {
    setPersistence(this.firebaseAuth, browserSessionPersistence);
  }

  async googleLoginWithPopup(): Promise<UserCredential> {
    const provider = new GoogleAuthProvider();
    try {
      return await signInWithPopup(this.firebaseAuth, provider);
    } catch (error) {
      console.error('Google-Login error:', error);
      throw error;
    }
  }

  async googleLoginWithRedirect(): Promise<void> {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(this.firebaseAuth, provider);
    } catch (error) {
      console.error('Google-Login error:', error);
      throw error;
    }
  }

  async handleRedirectResult(): Promise<User | null> {
    try {
      const result = await getRedirectResult(this.firebaseAuth);
      return result?.user || null;
    } catch (error) {
      console.error('Redirect result error:', error);
      throw error;
    }
  }

  logout(): Observable<void> {
    const promise = signOut(this.firebaseAuth).then(() => {
      sessionStorage.clear();
    });
    return from(promise);
  }

}
