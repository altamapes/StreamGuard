import { LastFmTrack } from '../types';
import { LAST_FM_API_URL } from '../constants';

interface LastFmResponse {
  recenttracks: {
    track: LastFmTrack[];
  };
}

/**
 * Fetches recent tracks from Last.fm.
 * Uses the provided apiKey. Falls back to mock data if apiKey is empty.
 */
export const fetchRecentTracks = async (username: string, apiKey: string): Promise<LastFmTrack[]> => {
  if (!username) return [];

  // If no API key is provided, use mock data for demonstration
  if (!apiKey) {
    console.warn('No API Key provided, using Mock Data.');
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockData);
      }, 1000);
    });
  }

  try {
    const url = `${LAST_FM_API_URL}?method=user.getrecenttracks&user=${username}&api_key=${apiKey}&format=json&limit=50`;
    const response = await fetch(url);
    
    if (!response.ok) {
        if (response.status === 403) {
            throw new Error('Invalid API Key');
        }
        throw new Error('Failed to fetch from Last.fm');
    }

    const data: LastFmResponse = await response.json();
    
    // Safety check for empty data
    if (!data.recenttracks || !data.recenttracks.track) {
        return [];
    }
    
    return data.recenttracks.track;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Mock data to simulate a user who has listened to some of the default tracks
const mockData: LastFmTrack[] = [
  {
    name: 'Super Shy',
    artist: { '#text': 'NewJeans' },
    album: { '#text': 'Get Up' }
  },
  {
    name: 'Blinding Lights',
    artist: { '#text': 'The Weeknd' },
    album: { '#text': 'After Hours' }
  },
  {
    name: 'Random Song',
    artist: { '#text': 'Random Artist' },
    album: { '#text': 'Random Album' }
  }
];