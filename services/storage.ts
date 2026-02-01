import { User, TargetTrack, CloudConfig, AppData } from '../types';
import { STORAGE_KEY, STORAGE_KEY_USERS, STORAGE_KEY_CLOUD, DEFAULT_TRACKS } from '../constants';

// --- CLOUD STORAGE SERVICE (JSONBin.io Adapter) ---

export const storageService = {
  
  // --- CONFIGURATION ---
  
  getCloudConfig(): CloudConfig | null {
    const stored = localStorage.getItem(STORAGE_KEY_CLOUD);
    return stored ? JSON.parse(stored) : null;
  },

  saveCloudConfig(config: CloudConfig) {
    localStorage.setItem(STORAGE_KEY_CLOUD, JSON.stringify(config));
  },

  disconnectCloud() {
    localStorage.removeItem(STORAGE_KEY_CLOUD);
  },

  // --- INTERNAL HELPERS ---

  // Fetches the entire DB (Users + Tracks)
  async _fetchFullData(): Promise<AppData> {
    const config = this.getCloudConfig();
    
    // 1. CLOUD MODE
    if (config && config.enabled && config.binId && config.apiKey) {
      try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${config.binId}/latest`, {
          method: 'GET',
          headers: {
            'X-Master-Key': config.apiKey,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) throw new Error('Cloud Sync Failed');
        
        const result = await response.json();
        // JSONBin v3 returns data inside a 'record' property
        return result.record as AppData;
      } catch (e) {
        console.error("Cloud Fetch Error:", e);
        // Fallback to local if cloud fails (optional strategy) or throw
        throw new Error("Could not connect to Cloud Database. Check your internet or keys.");
      }
    } 
    
    // 2. LOCAL MODE
    else {
      const usersStr = localStorage.getItem(STORAGE_KEY_USERS);
      const tracksStr = localStorage.getItem(STORAGE_KEY);
      return {
        users: usersStr ? JSON.parse(usersStr) : [],
        tracks: tracksStr ? JSON.parse(tracksStr) : DEFAULT_TRACKS
      };
    }
  },

  // Saves the entire DB
  async _saveFullData(data: AppData): Promise<void> {
    const config = this.getCloudConfig();

    // 1. CLOUD MODE
    if (config && config.enabled && config.binId && config.apiKey) {
       try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${config.binId}`, {
          method: 'PUT',
          headers: {
            'X-Master-Key': config.apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Cloud Save Failed');
        
        // Also update local cache so we don't feel slow
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(data.users));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.tracks));

      } catch (e) {
        console.error("Cloud Save Error:", e);
        throw new Error("Failed to save to Cloud.");
      }
    } 
    
    // 2. LOCAL MODE
    else {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(data.users));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.tracks));
    }
  },

  // --- PUBLIC METHODS (Abstracted) ---

  async getUsers(): Promise<User[]> {
    const data = await this._fetchFullData();
    // Initialize empty users array if new bin
    return data.users || [];
  },

  async registerUser(newUser: User): Promise<User> {
    const data = await this._fetchFullData();
    const users = data.users || [];
    
    if (users.some(u => u.appUsername.toLowerCase() === newUser.appUsername.toLowerCase())) {
      throw new Error('Username already taken');
    }
    
    const updatedUsers = [...users, newUser];
    const newData = { ...data, users: updatedUsers };
    
    await this._saveFullData(newData);
    return newUser;
  },

  async loginUser(username: string, password: string): Promise<User> {
    const data = await this._fetchFullData();
    const users = data.users || [];
    
    const user = users.find(u => 
      u.appUsername.toLowerCase() === username.toLowerCase() && 
      u.password === password
    );
    if (!user) throw new Error('Invalid credentials');
    return user;
  },

  async updateUserCheckIn(userId: string, dateString: string): Promise<User> {
    const data = await this._fetchFullData();
    const users = data.users || [];
    let updatedUser: User | null = null;
    
    const newUsers = users.map(u => {
      if (u.id === userId) {
        updatedUser = { ...u, lastCheckInDate: dateString };
        return updatedUser;
      }
      return u;
    });

    if (!updatedUser) throw new Error('User not found');
    
    await this._saveFullData({ ...data, users: newUsers });
    return updatedUser!;
  },

  // --- TRACK METHODS ---

  async getTracks(): Promise<TargetTrack[]> {
    const data = await this._fetchFullData();
    return data.tracks || DEFAULT_TRACKS;
  },

  async saveTracks(tracks: TargetTrack[]): Promise<void> {
    const data = await this._fetchFullData();
    await this._saveFullData({ ...data, tracks });
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