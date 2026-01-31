import { TargetTrack } from './types';

// NOTE: Ideally, this should be in an .env file.
// For the purpose of this demo, we use a placeholder.
// If the API key is invalid or not provided, the service will mock the response.
export const LAST_FM_API_KEY = 'YOUR_LAST_FM_API_KEY_HERE'; 
export const LAST_FM_API_URL = 'https://ws.audioscrobbler.com/2.0/';

export const ADMIN_PIN = '1234';

export const DEFAULT_TRACKS: TargetTrack[] = [
  { id: '1', artist: 'NewJeans', title: 'Super Shy' },
  { id: '2', artist: 'The Weeknd', title: 'Blinding Lights' },
  { id: '3', artist: 'Arctic Monkeys', title: 'Do I Wanna Know?' },
];

export const STORAGE_KEY = 'streamguard_playlist';