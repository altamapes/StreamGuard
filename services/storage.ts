import { User, TargetTrack, CloudConfig, AppData, WeeklySchedule, DayConfig } from '../types';
import { STORAGE_KEY, STORAGE_KEY_USERS, STORAGE_KEY_CLOUD, STORAGE_KEY_SPOTIFY, DEFAULT_TRACKS, DEFAULT_CLOUD_CONFIG, DEFAULT_SPOTIFY_ID, ADMIN_PIN } from '../constants';

// --- CLOUD STORAGE SERVICE (JSONBin.io Adapter) ---

export const storageService = {
  
  // --- CONFIGURATION ---
  
  getCloudConfig(): CloudConfig | null {
    // 1. Cek LocalStorage (Settingan Manual User)
    const stored = localStorage.getItem(STORAGE_KEY_CLOUD);
    if (stored) {
      return JSON.parse(stored);
    }

    // 2. Jika LocalStorage kosong, gunakan Default Config dari constants.ts
    if (DEFAULT_CLOUD_CONFIG.binId && DEFAULT_CLOUD_CONFIG.apiKey) {
      return DEFAULT_CLOUD_CONFIG;
    }

    return null;
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
        const record = result.record || {};
        
        return {
            users: Array.isArray(record.users) ? record.users : [],
            tracks: Array.isArray(record.tracks) ? record.tracks : (record.tracks || DEFAULT_TRACKS),
            spotifyPlaylistId: record.spotifyPlaylistId || DEFAULT_SPOTIFY_ID,
            weeklySchedule: record.weeklySchedule || {},
            adminPin: record.adminPin || ADMIN_PIN
        };

      } catch (e: any) {
        console.error("Cloud Fetch Error:", e);
        throw new Error(e.message || "Could not connect to Cloud Database.");
      }
    } 
    
    // 2. LOCAL MODE
    else {
      const usersStr = localStorage.getItem(STORAGE_KEY_USERS);
      const tracksStr = localStorage.getItem(STORAGE_KEY);
      const spotifyIdStr = localStorage.getItem(STORAGE_KEY_SPOTIFY);
      const scheduleStr = localStorage.getItem('streamguard_schedule');
      const pinStr = localStorage.getItem('streamguard_admin_pin');
      
      let users = [];
      let tracks = DEFAULT_TRACKS;
      let weeklySchedule = {};

      try {
          if (usersStr) users = JSON.parse(usersStr) || [];
          if (tracksStr) tracks = JSON.parse(tracksStr) || DEFAULT_TRACKS;
          if (scheduleStr) weeklySchedule = JSON.parse(scheduleStr) || {};
      } catch (e) { console.error("Error parsing local data", e); }
      
      return {
        users,
        tracks,
        spotifyPlaylistId: spotifyIdStr || DEFAULT_SPOTIFY_ID,
        weeklySchedule,
        adminPin: pinStr || ADMIN_PIN
      };
    }
  },

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
        
        // Update local cache
        this._updateLocalCache(data);

      } catch (e) {
        console.error("Cloud Save Error:", e);
        throw new Error("Failed to save to Cloud.");
      }
    } 
    
    // 2. LOCAL MODE
    else {
      this._updateLocalCache(data);
    }
  },

  _updateLocalCache(data: AppData) {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(data.users));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data.tracks));
    if (data.spotifyPlaylistId) localStorage.setItem(STORAGE_KEY_SPOTIFY, data.spotifyPlaylistId);
    if (data.weeklySchedule) localStorage.setItem('streamguard_schedule', JSON.stringify(data.weeklySchedule));
    if (data.adminPin) localStorage.setItem('streamguard_admin_pin', data.adminPin);
  },

  // --- PUBLIC METHODS ---

  async getUsers(): Promise<User[]> {
    const data = await this._fetchFullData();
    return Array.isArray(data.users) ? data.users : [];
  },

  async registerUser(newUser: User): Promise<User> {
    const data = await this._fetchFullData();
    const users = Array.isArray(data.users) ? data.users : [];
    
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
    const users = Array.isArray(data.users) ? data.users : [];
    
    const user = users.find(u => 
      u.appUsername.toLowerCase() === username.toLowerCase() && 
      u.password === password
    );
    if (!user) throw new Error('Invalid credentials');
    return user;
  },

  async updateUserCheckIn(userId: string, dateString: string): Promise<User> {
    const data = await this._fetchFullData();
    const users = Array.isArray(data.users) ? data.users : [];
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

  // NEW: Method to update user profile (Last.fm, Password, etc.)
  async updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
    const data = await this._fetchFullData();
    const users = Array.isArray(data.users) ? data.users : [];
    let updatedUser: User | null = null;
    
    const newUsers = users.map(u => {
      if (u.id === userId) {
        updatedUser = { ...u, ...updates };
        return updatedUser;
      }
      return u;
    });

    if (!updatedUser) throw new Error('User not found');
    
    await this._saveFullData({ ...data, users: newUsers });
    return updatedUser!;
  },

  // --- SMART GETTERS FOR MEMBER VIEW ---
  // Automatically returns TODAY's playlist if schedule exists

  async getTodayData(): Promise<{ tracks: TargetTrack[], spotifyId: string }> {
    const data = await this._fetchFullData();
    const todayIndex = new Date().getDay(); // 0 (Sun) to 6 (Sat)
    
    // Check if there is a schedule for today
    if (data.weeklySchedule && data.weeklySchedule[todayIndex]) {
        const todayConfig = data.weeklySchedule[todayIndex];
        // If today has tracks, use them. Otherwise fallback to global default.
        if (todayConfig.tracks && todayConfig.tracks.length > 0) {
            return {
                tracks: todayConfig.tracks,
                spotifyId: todayConfig.spotifyId || data.spotifyPlaylistId || DEFAULT_SPOTIFY_ID
            };
        }
    }

    // Fallback to legacy single playlist
    return {
        tracks: Array.isArray(data.tracks) ? data.tracks : DEFAULT_TRACKS,
        spotifyId: data.spotifyPlaylistId || DEFAULT_SPOTIFY_ID
    };
  },

  // --- ADMIN METHODS ---

  async getWeeklySchedule(): Promise<WeeklySchedule> {
    const data = await this._fetchFullData();
    return data.weeklySchedule || {};
  },

  async saveWeeklySchedule(schedule: WeeklySchedule): Promise<void> {
    const data = await this._fetchFullData();
    await this._saveFullData({ ...data, weeklySchedule: schedule });
  },

  async getAdminPin(): Promise<string> {
      const data = await this._fetchFullData();
      return data.adminPin || ADMIN_PIN;
  },

  async saveAdminPin(newPin: string): Promise<void> {
      const data = await this._fetchFullData();
      await this._saveFullData({ ...data, adminPin: newPin });
  },

  // --- BACKUP UTILS ---
  
  exportData() {
    return {
      users: localStorage.getItem(STORAGE_KEY_USERS),
      tracks: localStorage.getItem(STORAGE_KEY),
      spotify: localStorage.getItem(STORAGE_KEY_SPOTIFY),
      schedule: localStorage.getItem('streamguard_schedule'),
      adminPin: localStorage.getItem('streamguard_admin_pin')
    };
  },

  importData(usersJson: string | null, tracksJson: string | null, scheduleJson: string | null, pinJson: string | null) {
    if (usersJson) localStorage.setItem(STORAGE_KEY_USERS, usersJson);
    if (tracksJson) localStorage.setItem(STORAGE_KEY, tracksJson);
    if (scheduleJson) localStorage.setItem('streamguard_schedule', scheduleJson);
    if (pinJson) localStorage.setItem('streamguard_admin_pin', pinJson);
  }
};