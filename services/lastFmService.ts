import { LastFmTrack } from '../types';
import { LAST_FM_API_URL } from '../constants';

interface LastFmResponse {
  recenttracks?: {
    track: LastFmTrack[] | LastFmTrack; // Could be array or single object
  };
  error?: number;
  message?: string;
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
    const encodedUser = encodeURIComponent(username.trim());
    const cleanKey = apiKey.trim();
    const url = `${LAST_FM_API_URL}?method=user.getrecenttracks&user=${encodedUser}&api_key=${cleanKey}&format=json&limit=50`;
    
    const response = await fetch(url);
    const data: LastFmResponse = await response.json();
    
    if (!response.ok) {
        // Last.fm typically returns { error: number, message: string } on failure
        if (data.message) {
            throw new Error(data.message);
        }
        throw new Error(`Last.fm API Error: ${response.status}`);
    }

    // Explicit check for API error codes even if HTTP 200 (legacy behavior safeguard)
    if (data.error) {
         throw new Error(data.message || 'Last.fm API returned an error');
    }

    if (!data.recenttracks || !data.recenttracks.track) {
        return [];
    }
    
    // Fix: Last.fm returns a single object if only 1 track exists, instead of an array.
    // We must normalize this to always be an array.
    const tracks = data.recenttracks.track;
    return Array.isArray(tracks) ? tracks : [tracks];

  } catch (error: any) {
    console.error('API Error:', error);
    // Propagate the specific error message to the UI
    throw new Error(error.message || 'Failed to connect to Last.fm');
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
    name: 'Do I Wanna Know?',
    artist: { '#text': 'Arctic Monkeys' },
    album: { '#text': 'AM' }
  }
];