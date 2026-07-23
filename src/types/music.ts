export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  cover: ImageMetadata;
  coverAlt: string;
  src: string;
  licenseNote: string;
}

export interface PersistedMusicState {
  trackIndex: number;
  currentTime: number;
  volume: number;
}
