import { TargetTrack, CloudConfig } from './types';

export const LAST_FM_API_URL = 'https://ws.audioscrobbler.com/2.0/';

export const ADMIN_PIN = '1234';

// --- KONFIGURASI DEFAULT (HARDCODED) ---
// PENTING: Isi Bin ID dan API Key di dalam tanda kutip di bawah ini.
// Setelah diisi, lakukan DEPLOY ke Vercel agar bisa diakses orang lain/incognito.

export const DEFAULT_CLOUD_CONFIG: CloudConfig = {
  enabled: true, 
  binId: '', // CONTOH: '697f91db43b1c97be95dac80' (MASUKKAN BIN ID ANDA DI SINI)
  apiKey: '' // CONTOH: '$2a$10$iKUJm6gbggRWTuoxqK61Ie2g8JfOSKgKQusqyRbI5LUzdMSgDvfum' (MASUKKAN API KEY ANDA DI SINI)
};

export const DEFAULT_TRACKS: TargetTrack[] = [
  { id: '1', artist: 'NewJeans', title: 'Super Shy' },
  { id: '2', artist: 'The Weeknd', title: 'Blinding Lights' },
  { id: '3', artist: 'Arctic Monkeys', title: 'Do I Wanna Know?' },
];

export const STORAGE_KEY = 'streamguard_playlist';
export const STORAGE_KEY_USERS = 'streamguard_users_db'; 
export const STORAGE_KEY_CLOUD = 'streamguard_cloud_config'; 