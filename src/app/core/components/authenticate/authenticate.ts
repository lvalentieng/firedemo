import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-authenticate',
  imports: [],
  templateUrl: './authenticate.html',
  styleUrl: './authenticate.css'
})
export class Authenticate {

  private authService: AuthService = inject(AuthService);
  private router: Router = inject(Router);

  async onGoogleSignIn(): Promise<void> {
    try {
      await this.authService.googleLogin();
      this.router.navigateByUrl('');
    } catch (error) {
      console.error('Google Sign-In error:', error);
      alert("Login fallita miseramente " + error)
    }
  }

}
