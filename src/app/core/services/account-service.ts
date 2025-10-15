import { inject, Injectable } from '@angular/core';
import { Firestore, doc, setDoc, getDoc, updateDoc, collection, getDocs } from '@angular/fire/firestore';
import { Auth, user } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { Account } from '../models/user-profile-model';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private firestore: Firestore = inject(Firestore);
  private auth: Auth = inject(Auth);

  user$ = user(this.auth);

  // Crea documento utente in Firestore alla registrazione
  async createAccountDocument(uid: string, email: string, displayName: string) {
    const accountRef = doc(this.firestore, `accounts/${uid}`);
    const accountData: Partial<Account> = {
      uid,
      email,
      displayName,
      role: 'pending', // Ruolo di default
      createdAt: new Date()
    };
    await setDoc(accountRef, accountData);
  }

  // Ottieni i dati utente da Firestore
  async getAccountData(uid: string): Promise<Account | null> {
    const accountRef = doc(this.firestore, `accounts/${uid}`);
    const accountSnap = await getDoc(accountRef);
    if (accountSnap.exists()) {
      return accountSnap.data() as Account;
    }
    return null;
  }

  // Ottieni il ruolo dell'utente corrente
  async getCurrentUserRole(): Promise<'pending' | 'user' | 'admin' | null> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      return null;
    }
    const accountData = await this.getAccountData(currentUser.uid);
    return accountData?.role || null;
  }

  // Aggiorna il ruolo di un utente (solo per admin)
  async updateAccountRole(uid: string, newRole: 'pending' | 'user' | 'admin') {
    const accountRef = doc(this.firestore, `accounts/${uid}`);
    await updateDoc(accountRef, { role: newRole });
  }

  // Ottieni lista di tutti gli utenti (per pannello admin)
  async getAllAccounts(): Promise<Account[]> {
    const accountsCollection = collection(this.firestore, 'accounts');
    const accountsSnapshot = await getDocs(accountsCollection);
    return accountsSnapshot.docs.map(doc => doc.data() as Account);
  }
}
