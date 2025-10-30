import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { Video } from '../../../../core/models/video-model';
import { Firestore, collection, getDocs, doc, addDoc, deleteDoc, Timestamp } from '@angular/fire/firestore';
import { ButtonModule } from 'primeng/button';
import { PanelModule } from 'primeng/panel';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { SafePipe } from '../../../../core/pipes/safe.pipe';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-fstore-video-navigator',
  imports: [TableModule, CommonModule, ButtonModule, PanelModule, FormsModule, InputTextModule, DialogModule, SafePipe, ToastModule],
  providers: [MessageService],
  templateUrl: './fstore-video-navigator.html',
  styleUrl: './fstore-video-navigator.css'
})
export class FstoreVideoNavigator implements OnInit {
  private route = inject(ActivatedRoute);
  private firestore = inject(Firestore);
  private messageService = inject(MessageService);

  movieId = signal<string | null>(null);
  videos = signal<Video[]>([]);
  isLoading = signal(false);

  // Dialog per aggiungere nuovo video
  showAddDialog = signal(false);
  newVideo = signal<Partial<Video>>({
    youtubeUrl: '',
    fromTime: '',
    toTime: ''
  });

  async ngOnInit(): Promise<void> {
    // Leggi il movieId dall'URL
    this.route.params.subscribe(async params => {
      const id = params['id'];
      if (id) {
        this.movieId.set(id);
        await this.loadVideos(id);
      }
    });
  }

  async loadVideos(movieId: string): Promise<void> {
    this.isLoading.set(true);
    try {
      const videosCollection = collection(this.firestore, 'movies', movieId, 'videos');
      const querySnapshot = await getDocs(videosCollection);
      
      const videosData: Video[] = [];
      querySnapshot.forEach((doc) => {
        videosData.push({
          ...doc.data() as Video,
          id: doc.id
        });
      });

      this.videos.set(videosData);
      this.isLoading.set(false);
    } catch (error) {
      console.error('Error loading videos from Firestore:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Errore',
        detail: 'Errore nel caricamento dei video da Firestore',
        life: 5000
      });
      this.isLoading.set(false);
    }
  }

  openAddDialog(): void {
    this.newVideo.set({
      youtubeUrl: '',
      fromTime: '',
      toTime: ''
    });
    this.showAddDialog.set(true);
  }

  closeAddDialog(): void {
    this.showAddDialog.set(false);
  }

  async addVideo(): Promise<void> {
    const movieId = this.movieId();
    const video = this.newVideo();

    if (!movieId) return;

    // Validazione
    if (!video.youtubeUrl || video.youtubeUrl.trim() === '') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Attenzione',
        detail: 'L\'URL di YouTube è obbligatorio!',
        life: 3000
      });
      return;
    }

    this.isLoading.set(true);
    try {
      const videosCollection = collection(this.firestore, 'movies', movieId, 'videos');
      
      const videoData: Partial<Video> = {
        youtubeUrl: video.youtubeUrl.trim(),
        createdAt: Timestamp.now()
      };

      // Aggiungi fromTime e toTime solo se non sono vuoti
      if (video.fromTime && video.fromTime.trim() !== '') {
        videoData.fromTime = video.fromTime.trim();
      }
      if (video.toTime && video.toTime.trim() !== '') {
        videoData.toTime = video.toTime.trim();
      }

      await addDoc(videosCollection, videoData);

      // Ricarica i video
      await this.loadVideos(movieId);

      this.closeAddDialog();
      this.messageService.add({
        severity: 'success',
        summary: 'Successo',
        detail: 'Video aggiunto con successo!',
        life: 3000
      });
    } catch (error) {
      console.error('Error adding video:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Errore',
        detail: 'Errore nell\'aggiunta del video',
        life: 5000
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  async deleteVideo(videoId: string): Promise<void> {
    const movieId = this.movieId();
    if (!movieId) return;

    if (!confirm('Vuoi davvero eliminare questo video?')) {
      return;
    }

    this.isLoading.set(true);
    try {
      const videoDoc = doc(this.firestore, 'movies', movieId, 'videos', videoId);
      await deleteDoc(videoDoc);

      // Aggiorna lo stato locale
      this.videos.update(videos => 
        videos.filter(v => v.id !== videoId)
      );

      this.messageService.add({
        severity: 'success',
        summary: 'Successo',
        detail: 'Video eliminato con successo!',
        life: 3000
      });
    } catch (error) {
      console.error('Error deleting video:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Errore',
        detail: 'Errore nell\'eliminazione del video',
        life: 5000
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  openVideo(video: Video): void {
    // Apre il video con i parametri di tempo se specificati
    const url = this.getYouTubeWatchUrlWithTime(video);
    window.open(url, '_blank');
  }

  getYouTubeWatchUrlWithTime(video: Video): string {
    // Costruisce l'URL di YouTube con i parametri di tempo
    let url = video.youtubeUrl;
    
    const params: string[] = [];
    
    if (video.fromTime) {
      params.push(`t=${this.timeToSeconds(video.fromTime)}`);
    }
    
    // Nota: YouTube non supporta nativamente il parametro 'end' negli URL watch,
    // ma possiamo includere il parametro start per iniziare dal tempo specificato
    
    if (params.length > 0) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}${params.join('&')}`;
    }
    
    return url;
  }

  getYouTubeEmbedUrl(youtubeUrl: string): string {
    // Estrae l'ID del video da vari formati di URL YouTube
    let videoId = '';
    
    try {
      const url = new URL(youtubeUrl);
      
      if (url.hostname.includes('youtu.be')) {
        // Formato: https://youtu.be/VIDEO_ID
        videoId = url.pathname.substring(1);
      } else if (url.hostname.includes('youtube.com')) {
        // Formato: https://www.youtube.com/watch?v=VIDEO_ID
        videoId = url.searchParams.get('v') || '';
      }
      
      return `https://www.youtube.com/embed/${videoId}`;
    } catch (e) {
      console.error('Invalid YouTube URL:', e);
      return '';
    }
  }

  getYouTubeEmbedUrlWithTime(video: Video): string {
    const baseUrl = this.getYouTubeEmbedUrl(video.youtubeUrl);
    
    if (!baseUrl) return '';
    
    const params: string[] = [];
    
    if (video.fromTime) {
      params.push(`start=${this.timeToSeconds(video.fromTime)}`);
    }
    
    if (video.toTime) {
      params.push(`end=${this.timeToSeconds(video.toTime)}`);
    }
    
    if (params.length > 0) {
      return `${baseUrl}?${params.join('&')}`;
    }
    
    return baseUrl;
  }

  private timeToSeconds(time: string): number {
    // Converte formato HH:MM:SS o MM:SS o SS in secondi
    const parts = time.split(':').map(p => parseInt(p, 10));
    
    if (parts.length === 3) {
      // HH:MM:SS
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      // MM:SS
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 1) {
      // SS
      return parts[0];
    }
    
    return 0;
  }

  updateNewVideoField(field: keyof Video, value: string): void {
    this.newVideo.update(video => ({
      ...video,
      [field]: value
    }));
  }
}
