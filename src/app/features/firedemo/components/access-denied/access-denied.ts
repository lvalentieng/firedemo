import { Component, inject, OnInit, signal } from '@angular/core';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';

@Component({
  selector: 'app-access-denied',
  imports: [],
  templateUrl: './access-denied.html',
  styleUrl: './access-denied.css'
})
export class AccessDenied implements OnInit {
  private firestore = inject(Firestore);
  
  currentVersion = signal<string>('');
  isLoading = signal(true);

  async ngOnInit(): Promise<void> {
    await this.loadVersion();
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
