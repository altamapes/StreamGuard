export interface TargetTrack {
  id: string;
  artist: string;
  title: string;
}

export interface LastFmTrack {
  name: string;
  artist: {
    '#text': string;
  };
  album: {
    '#text': string;
  };
  date?: {
    uts: string;
    '#text': string;
  };
  '@attr'?: {
    nowplaying: string;
  };
}

export enum ViewMode {
  AUTH = 'AUTH',
  MEMBER = 'MEMBER',
  ADMIN = 'ADMIN'
}

export interface CheckStatus {
  trackId: string;
  isListened: boolean;
}

export interface User {
  id: string;
  appUsername: string; // Username for login
  password: string;    // Password for login (simple storage)
  lastFmUsername: string;
  lastFmApiKey: string;
  lastCheckInDate: string | null; // Stores the date string (e.g. "20/02/2024")
}

export interface CloudConfig {
  enabled: boolean;
  binId: string;
  apiKey: string;
}

export interface AppData {
  users: User[];
  tracks: TargetTrack[];
}