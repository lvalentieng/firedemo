import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-private',
  imports: [RouterOutlet],
  templateUrl: './private.html',
  styleUrl: './private.css'
})
export class Private {
  private authService = inject(AuthService);

  role: any = this.authService.currentUserRole();

}
