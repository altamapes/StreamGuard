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

  // Verify connection validity before saving
  async verifyConnection(binId: string, apiKey: string): Promise<{valid: boolean; message?: string}> {
    try {
        const cleanBinId = binId.trim();
        const cleanApiKey = apiKey.trim();

        if (!cleanBinId || !cleanApiKey) return { valid: false, message: 'Bin ID and API Key are required' };

        const response = await fetch(`https://api.jsonbin.io/v3/b/${cleanBinId}/latest`, {
          method: 'GET',
          headers: {
            'X-Master-Key': cleanApiKey,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) return { valid: true };
        
        if (response.status === 401 || response.status === 403) return { valid: false, message: 'Invalid API Key or Access Denied' };
        if (response.status === 404) return { valid: false, message: 'Bin ID not found' };
        
        return { valid: false, message: `Connection failed: ${response.statusText}` };
    } catch (e: any) {
        return { valid: false, message: 'Network error or invalid configuration' };
    }
  },

  // --- INTERNAL HELPERS ---

  // Fetches the entire DB (Users + Tracks)
  async _fetchFullData(): Promise<AppData> {
    const config = this.getCloudConfig();
    
    // 1. CLOUD MODE
    if (config && config.enabled && config.binId && config.apiKey) {
      const cleanBinId = config.binId.trim();
      const cleanApiKey = config.apiKey.trim();

      try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${cleanBinId}/latest`, {
          method: 'GET',
          headers: {
            'X-Master-Key': cleanApiKey,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) throw new Error('Cloud Auth Failed: Check API Key');
            if (response.status === 404) throw new Error('Cloud Error: Bin ID not found');
            throw new Error(`Cloud Sync Failed (${response.status})`);
        }
        
        const result = await response.json();
        // JSONBin v3 returns data inside a 'record' property
        return result.record as AppData;
      } catch (e: any) {
        console.error("Cloud Fetch Error:", e);
        throw new Error(e.message || "Could not connect to Cloud Database.");
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
       const cleanBinId = config.binId.trim();
       const cleanApiKey = config.apiKey.trim();
       
       try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${cleanBinId}`, {
          method: 'PUT',
          headers: {
            'X-Master-Key': cleanApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error(`Cloud Save Failed (${response.status})`);
        
        // Also update local cache
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