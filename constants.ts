import { TargetTrack, CloudConfig } from './types';

export const LAST_FM_API_URL = 'https://ws.audioscrobbler.com/2.0/';

export const ADMIN_PIN = '1234';

// --- KONFIGURASI DEFAULT (HARDCODED) ---
// Isi ini agar user lain/incognito otomatis terkoneksi.
// Jika kosong, user harus input manual via Admin Panel.
export const DEFAULT_CLOUD_CONFIG: CloudConfig = {
  enabled: true, // Set true agar otomatis aktif
  binId: '', // CONTOH: '65d4f8...' (Tempel Bin ID Anda di antara tanda kutip)
  apiKey: '' // CONTOH: '$2a$10$...' (Tempel X-Master-Key Anda di antara tanda kutip)
};

export const DEFAULT_TRACKS: TargetTrack[] = [
  { id: '1', artist: 'NewJeans', title: 'Super Shy' },
  { id: '2', artist: 'The Weeknd', title: 'Blinding Lights' },
  { id: '3', artist: 'Arctic Monkeys', title: 'Do I Wanna Know?' },
];

export const STORAGE_KEY = 'streamguard_playlist';
export const STORAGE_KEY_USERS = 'streamguard_users_db'; // "Database" for users
export const STORAGE_KEY_CLOUD = 'streamguard_cloud_config'; // Stores API keys locally