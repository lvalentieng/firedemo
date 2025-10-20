import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';

@Component({
  selector: 'app-admin-panel',
  imports: [RouterOutlet, Menubar],
  templateUrl: './admin-panel.html',
  styleUrl: './admin-panel.css'
})
export class AdminPanel {
  items: MenuItem[] = [
    { label: 'User Management', icon: 'pi pi-users', routerLink: '/private/admin/user' },
    { label: 'Movie CRUD', icon: 'pi pi-film', routerLink: '/private/admin/movie' },
    { label: 'TMDB Navigator', icon: 'pi pi-search', routerLink: '/private/admin/tmdb' }
  ];

  ngOnInit() {

  }
}
