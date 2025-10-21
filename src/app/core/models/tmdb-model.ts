export interface TmdbMovie {
  adult: boolean;
  backdrop_path: string;
  genre_ids: number[];
  id: number;
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string;
  release_date: string;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
}

export interface TmdbResponse {
  page: number;
  results: TmdbMovie[];
  total_pages: number;
  total_results: number;
}

export interface TmdbImage {
  aspect_ratio: number;
  height: number;
  iso_3166_1: string | null;
  iso_639_1: string | null;
  file_path: string;
  vote_average: number;
  vote_count: number;
  width: number;
  obscured?: boolean; // Attributo custom per oscurare l'immagine
}

export interface TmdbImagesResponse {
  backdrops: TmdbImage[];
  id: number;
  logos: TmdbImage[];
  posters: TmdbImage[];
}
