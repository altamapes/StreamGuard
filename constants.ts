import { TargetTrack } from './types';

export const LAST_FM_API_URL = 'https://ws.audioscrobbler.com/2.0/';

export const ADMIN_PIN = '1234';

export const DEFAULT_TRACKS: TargetTrack[] = [
  { id: '1', artist: 'NewJeans', title: 'Super Shy' },
  { id: '2', artist: 'The Weeknd', title: 'Blinding Lights' },
  { id: '3', artist: 'Arctic Monkeys', title: 'Do I Wanna Know?' },
];

export const STORAGE_KEY = 'streamguard_playlist';
export const STORAGE_KEY_API_KEY = 'streamguard_api_key';
export const STORAGE_KEY_LAST_CHECKIN = 'streamguard_last_checkin';