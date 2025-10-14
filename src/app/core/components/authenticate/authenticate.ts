import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-authenticate',
  imports: [],
  templateUrl: './authenticate.html',
  styleUrl: './authenticate.css'
})
export class Authenticate implements OnInit {

  private authService: AuthService = inject(AuthService);
  private router: Router = inject(Router);

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
  }

  async onGoogleSignInWithPopup(): Promise<void> {
    try {
      await this.authService.googleLoginWithPopup();
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

}
