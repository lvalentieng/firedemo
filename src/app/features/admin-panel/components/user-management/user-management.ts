import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountService } from '../../../../core/services/account-service';
import { Account } from '../../../../core/models/user-profile-model';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { ButtonModule } from 'primeng/button';
import { PanelModule } from 'primeng/panel';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-user-management',
  imports: [CommonModule, FormsModule, TableModule, PaginatorModule, ButtonModule, PanelModule, SelectModule],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css'
})
export class UserManagement implements OnInit {
  private accountService = inject(AccountService);

  accounts = signal<Account[]>([]);
  filteredAccounts = signal<Account[]>([]);
  isLoading = signal(true);
  
  // Paginazione
  currentPage = signal(0);
  firstElementPage = signal(0);
  pageSize = 10;
  totalResults = signal(0);

  // Filtri
  filterRole = signal<'all' | 'pending' | 'user' | 'admin'>('all');
  filterOptions = [
    { label: 'Tutti', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'User', value: 'user' },
    { label: 'Admin', value: 'admin' }
  ];

  paginatedAccounts = computed(() => {
    const startIndex = this.firstElementPage();
    const endIndex = startIndex + this.pageSize;
    return this.filteredAccounts().slice(startIndex, endIndex);
  });

  async ngOnInit(): Promise<void> {
    await this.loadAccounts();
  }

  async loadAccounts(): Promise<void> {
    this.isLoading.set(true);
    try {
      const accountsData = await this.accountService.getAllAccounts();
      this.accounts.set(accountsData);
      this.applyFilter();
    } catch (error) {
      console.error('Error loading accounts:', error);
      alert('Errore nel caricamento degli account: ' + error);
    } finally {
      this.isLoading.set(false);
    }
  }

  applyFilter(): void {
    const role = this.filterRole();
    if (role === 'all') {
      this.filteredAccounts.set([...this.accounts()]);
    } else {
      this.filteredAccounts.set(this.accounts().filter(acc => acc.role === role));
    }
    this.totalResults.set(this.filteredAccounts().length);
    this.currentPage.set(0);
    this.firstElementPage.set(0);
  }

  async updateRole(uid: string, newRole: 'pending' | 'user' | 'admin'): Promise<void> {
    if (!confirm(`Vuoi cambiare il ruolo di questo utente a "${newRole}"?`)) {
      return;
    }

    this.isLoading.set(true);
    try {
      await this.accountService.updateAccountRole(uid, newRole);
      console.log(`Ruolo aggiornato per ${uid} a ${newRole}`);
      await this.loadAccounts();
      alert('Ruolo aggiornato con successo!');
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Errore nell\'aggiornamento del ruolo: ' + error);
    } finally {
      this.isLoading.set(false);
    }
  }

  onPageChange(event: any): void {
    console.debug('UserManagement - onPageChange():', event);

    const pageToShow = event.rows !== this.pageSize ? 0 : event.page;
    this.currentPage.set(pageToShow || 0);
    this.firstElementPage.set(event.first ?? 0);
  }

  getRoleColor(role: string): string {
    switch (role) {
      case 'admin': return '#22c55e';
      case 'user': return '#3b82f6';
      case 'pending': return '#f97316';
      default: return '#6b7280';
    }
  }

  getRoleSeverity(role: string): 'success' | 'info' | 'warn' | 'secondary' {
    switch (role) {
      case 'admin': return 'success';
      case 'user': return 'info';
      case 'pending': return 'warn';
      default: return 'secondary';
    }
  }
}
