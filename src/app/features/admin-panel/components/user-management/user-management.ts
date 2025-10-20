import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountService } from '../../../../core/services/account-service';
import { Account } from '../../../../core/models/user-profile-model';

@Component({
  selector: 'app-user-management',
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css'
})
export class UserManagement implements OnInit {
  private accountService = inject(AccountService);

  accounts = signal<Account[]>([]);
  filteredAccounts = signal<Account[]>([]);
  isLoading = signal(true);
  
  // Paginazione
  currentPage = signal(1);
  pageSize = 10;
  totalPages = signal(0);

  // Filtri
  filterRole = signal<'all' | 'pending' | 'user' | 'admin'>('all');

  paginatedAccounts = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredAccounts().slice(startIndex, endIndex);
  });

  pageNumbers = computed(() => {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
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
    this.totalPages.set(Math.ceil(this.filteredAccounts().length / this.pageSize));
    this.currentPage.set(1);
  }

  async updateRole(uid: string, newRole: 'pending' | 'user' | 'admin'): Promise<void> {
    try {
      await this.accountService.updateAccountRole(uid, newRole);
      console.log(`Ruolo aggiornato per ${uid} a ${newRole}`);
      await this.loadAccounts();
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Errore nell\'aggiornamento del ruolo: ' + error);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(page => page + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(page => page - 1);
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }
}
