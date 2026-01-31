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
  MEMBER = 'MEMBER',
  ADMIN = 'ADMIN'
}

export interface CheckStatus {
  trackId: string;
  isListened: boolean;
}