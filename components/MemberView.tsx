import React, { useState } from 'react';
import { CheckCircle2, Circle, RefreshCw, Trophy, AlertCircle } from 'lucide-react';
import { TargetTrack, LastFmTrack } from '../types';
import { fetchRecentTracks } from '../services/lastFmService';

interface MemberViewProps {
  tracks: TargetTrack[];
}

export const MemberView: React.FC<MemberViewProps> = ({ tracks }) => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [synced, setSynced] = useState(false);
  const [matchedTrackIds, setMatchedTrackIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const calculateProgress = () => {
    if (tracks.length === 0) return 0;
    return Math.round((matchedTrackIds.size / tracks.length) * 100);
  };

  const handleSync = async () => {
    if (!username) {
      setError('Please enter a Last.fm username');
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const recentTracks = await fetchRecentTracks(username);
      
      const newMatches = new Set<string>();

      tracks.forEach(target => {
        // Normalize for loose comparison
        const tArtist = target.artist.toLowerCase();
        const tTitle = target.title.toLowerCase();

        const found = recentTracks.some(recent => {
          const rArtist = recent.artist['#text'].toLowerCase();
          const rTitle = recent.name.toLowerCase();
          // Check if target matches recent
          return rArtist.includes(tArtist) && rTitle.includes(tTitle);
        });

        if (found) {
          newMatches.add(target.id);
        }
      });

      setMatchedTrackIds(newMatches);
      setSynced(true);
    } catch (err) {
      setError('Failed to sync. Please check username or try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const progress = calculateProgress();
  const isComplete = progress === 100 && tracks.length > 0;

  return (
    <div className="w-full max-w-md mx-auto p-4 flex flex-col items-center">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-blue-400 mb-2 drop-shadow-sm">
          StreamGuard
        </h1>
        <p className="text-purple-200 opacity-80 font-medium">Community Check Dashboard</p>
      </div>

      {/* Input Section */}
      <div className="w-full glass p-6 rounded-2xl mb-6 shadow-[0_0_30px_rgba(0,0,0,0.3)]">
        <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wider">
          Last.fm Username
        </label>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. user123"
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-green text-white placeholder-gray-500 transition-colors"
          />
          <button 
            onClick={handleSync}
            disabled={isLoading}
            className={`px-4 rounded-xl font-bold flex items-center gap-2 transition-all ${
              isLoading 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
            }`}
          >
            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
            {isLoading ? '...' : 'Sync'}
          </button>
        </div>
        {error && (
            <div className="mt-3 flex items-center gap-2 text-red-400 text-sm bg-red-900/20 p-2 rounded-lg">
                <AlertCircle size={16} />
                {error}
            </div>
        )}
      </div>

      {synced && (
        <div className="w-full animate-fade-in-up">
          {/* Progress Bar */}
          <div className="glass p-6 rounded-2xl mb-6">
            <div className="flex justify-between items-end mb-2">
              <span className="text-gray-400 font-medium">Daily Goal</span>
              <span className={`text-2xl font-bold ${isComplete ? 'text-neon-green' : 'text-white'}`}>
                {progress}%
              </span>
            </div>
            <div className="h-4 w-full bg-black/50 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-neon-green to-emerald-600 transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Track List */}
          <div className="space-y-3 mb-8">
            {tracks.length === 0 ? (
                <div className="text-center text-gray-500 py-4">Admin hasn't set any tracks yet.</div>
            ) : (
                tracks.map((track) => {
                const isListened = matchedTrackIds.has(track.id);
                return (
                    <div 
                    key={track.id} 
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                        isListened 
                        ? 'bg-green-900/10 border-green-500/30 shadow-[0_0_10px_rgba(0,255,65,0.1)]' 
                        : 'bg-white/5 border-white/5 opacity-80'
                    }`}
                    >
                    <div className="flex-1 pr-4">
                        <div className={`font-bold ${isListened ? 'text-green-300' : 'text-white'}`}>
                        {track.title}
                        </div>
                        <div className="text-sm text-gray-400">{track.artist}</div>
                    </div>
                    <div className="flex-shrink-0">
                        {isListened ? (
                        <CheckCircle2 className="text-neon-green drop-shadow-[0_0_8px_rgba(0,255,65,0.8)]" size={28} />
                        ) : (
                        <Circle className="text-gray-600" size={28} />
                        )}
                    </div>
                    </div>
                );
                })
            )}
          </div>

          {/* Daily Check-In Button */}
          <button 
            disabled={!isComplete}
            className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-500 ${
              isComplete 
                ? 'bg-gradient-to-r from-neon-purple to-pink-600 text-white shadow-[0_0_30px_rgba(176,38,255,0.6)] scale-100 hover:scale-[1.02]' 
                : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
            }`}
          >
            <Trophy size={24} className={isComplete ? 'text-yellow-300' : ''} />
            {isComplete ? 'CLAIM DAILY CHECK-IN' : 'Complete 100% to Check-In'}
          </button>
        </div>
      )}
    </div>
  );
};