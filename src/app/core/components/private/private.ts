import { Component, inject, OnInit } from '@angular/core';
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

  role: 'pending' | 'user' | 'admin' | null = null;
  
  async ngOnInit(): Promise<void> {
    this.role = await this.accountService.getCurrentUserRole();

  }
}
