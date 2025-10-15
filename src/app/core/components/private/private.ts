import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { AccountService } from '../../services/account-service';

@Component({
  selector: 'app-private',
  imports: [RouterOutlet],
  templateUrl: './private.html',
  styleUrl: './private.css'
})
export class Private implements OnInit {
  private accountService = inject(AccountService);

  role = signal<'pending' | 'user' | 'admin' | null>(null);
  
  async ngOnInit(): Promise<void> {
    console.log('ngOnInit private');
    const userRole = await this.accountService.getCurrentUserRole();
    this.role.set(userRole);
  }
}
