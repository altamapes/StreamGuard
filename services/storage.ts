import { User, TargetTrack } from '../types';
import { STORAGE_KEY, STORAGE_KEY_USERS, DEFAULT_TRACKS } from '../constants';

// --- DATA SERVICE LAYER ---
// Currently uses LocalStorage, but designed to be easily swapped 
// with a real MySQL/Supabase API call in the future.

// Helper to simulate network delay (optional, for realism)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const storageService = {
  
  // --- USER METHODS ---

  async getUsers(): Promise<User[]> {
    // MySQL Example: return fetch('/api/users').then(res => res.json());
    const stored = localStorage.getItem(STORAGE_KEY_USERS);
    return stored ? JSON.parse(stored) : [];
  },

  async registerUser(newUser: User): Promise<User> {
    // MySQL Example: return fetch('/api/register', { method: 'POST', body: ... });
    const users = await this.getUsers();
    if (users.some(u => u.appUsername.toLowerCase() === newUser.appUsername.toLowerCase())) {
      throw new Error('Username already taken');
    }
    const updatedUsers = [...users, newUser];
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updatedUsers));
    return newUser;
  },

  async loginUser(username: string, password: string): Promise<User> {
    // MySQL Example: return fetch('/api/login', { method: 'POST', body: ... });
    const users = await this.getUsers();
    const user = users.find(u => 
      u.appUsername.toLowerCase() === username.toLowerCase() && 
      u.password === password
    );
    if (!user) throw new Error('Invalid credentials');
    return user;
  },

  async updateUserCheckIn(userId: string, dateString: string): Promise<User> {
    // MySQL Example: return fetch(`/api/users/${userId}/checkin`, { method: 'POST' ... });
    const users = await this.getUsers();
    let updatedUser: User | null = null;
    
    const newUsers = users.map(u => {
      if (u.id === userId) {
        updatedUser = { ...u, lastCheckInDate: dateString };
        return updatedUser;
      }
      return u;
    });

    if (!updatedUser) throw new Error('User not found');
    
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(newUsers));
    return updatedUser!;
  },

  // --- TRACK METHODS ---

  async getTracks(): Promise<TargetTrack[]> {
    // MySQL Example: return fetch('/api/tracks').then(res => res.json());
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_TRACKS;
  },

  async saveTracks(tracks: TargetTrack[]): Promise<void> {
    // MySQL Example: return fetch('/api/tracks', { method: 'POST', body: ... });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tracks));
  },

  // --- BACKUP UTILS (Frontend Only) ---
  
  exportData() {
    return {
      users: localStorage.getItem(STORAGE_KEY_USERS),
      tracks: localStorage.getItem(STORAGE_KEY)
    };
  },

  importData(usersJson: string | null, tracksJson: string | null) {
    if (usersJson) localStorage.setItem(STORAGE_KEY_USERS, usersJson);
    if (tracksJson) localStorage.setItem(STORAGE_KEY, tracksJson);
  }
};