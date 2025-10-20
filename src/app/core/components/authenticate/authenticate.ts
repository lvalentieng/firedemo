import { Component, inject, OnInit, signal } from '@angular/core';
import { AuthService } from '../../services/auth-service';
import { Router } from '@angular/router';
import { AccountService } from '../../services/account-service';
import { collection, Firestore, getDocs } from '@angular/fire/firestore';

@Component({
  selector: 'app-authenticate',
  imports: [],
  templateUrl: './authenticate.html',
  styleUrl: './authenticate.css'
})
export class Authenticate implements OnInit {

  private authService: AuthService = inject(AuthService);
  private accountService: AccountService = inject(AccountService);
  private router: Router = inject(Router);
  private firestore = inject(Firestore);

  currentVersion = signal<string>('');
  isLoading = signal(true);

  async ngOnInit(): Promise<void> {
    // Gestisce il risultato del redirect dopo il login con Google
    try {
      const user = await this.authService.handleRedirectResult();
      if (user) {
        // L'utente ha appena effettuato il login tramite redirect
        this.router.navigateByUrl('');
      }
    } catch (error) {
      console.error('Redirect authentication error:', error);
      alert("Login fallita: " + error);
    }

    // Monitora lo stato di autenticazione
    this.authService.user$.subscribe(user => {
      if (user) {
        // Utente autenticato, reindirizza alla dashboard
        this.router.navigateByUrl('');
      }
    });
  
    await this.loadVersion();
  }

  async onGoogleSignInWithPopup(): Promise<void> {
    try {
      const result = await this.authService.googleLoginWithPopup();
      const user = result.user;
      console.log("Utente autenticato:", user);

      // Controlla se il documento esiste già, altrimenti crealo
      const userData = await this.accountService.getAccountData(user.uid);
      if (!userData) {
        await this.accountService.createAccountDocument(
          user.uid,
          user.email || '',
          user.displayName || 'Utente'
        );
        console.log('Documento utente creato in Firestore');
      }

      console.log('redirect');
      this.router.navigateByUrl('');
    } catch (error) {
      console.error('Google Sign-In error:', error);
      alert("Login fallita miseramente " + error)
    }
  }

  async onGoogleSignInWithRedirect(): Promise<void> {
    try {
      // Questo avvierà il redirect verso Google
      await this.authService.googleLoginWithRedirect();
      // Il codice dopo questa riga non verrà eseguito perché la pagina verrà reindirizzata
    } catch (error) {
      console.error('Google Sign-In error:', error);
      alert("Login fallita miseramente " + error)
    }
  }

  async loadVersion(): Promise<void> {
    this.isLoading.set(true);
    try {
      const versionCollection = collection(this.firestore, 'version');
      const snapshot = await getDocs(versionCollection);
      
      if (!snapshot.empty) {
        const versionDoc = snapshot.docs[0];
        const data = versionDoc.data();
        this.currentVersion.set(data['current'] || 'N/A');
      }
    } catch (error) {
      console.error('Error loading version:', error);
      this.currentVersion.set('Errore nel caricamento');
    } finally {
      this.isLoading.set(false);
    }
  }

}
