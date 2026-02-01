import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, RefreshCw, Trophy, AlertCircle, Key, User, X, Clock, CalendarCheck } from 'lucide-react';
import { TargetTrack } from '../types';
import { fetchRecentTracks } from '../services/lastFmService';
import { STORAGE_KEY_API_KEY, STORAGE_KEY_LAST_CHECKIN } from '../constants';

interface MemberViewProps {
  tracks: TargetTrack[];
}

export const MemberView: React.FC<MemberViewProps> = ({ tracks }) => {
  const [username, setUsername] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [synced, setSynced] = useState(false);
  
  // Changed from Set<string> to Record<string, string> to store the time
  const [matchedStatus, setMatchedStatus] = useState<Record<string, string>>({});
  
  const [error, setError] = useState<string | null>(null);
  const [showReward, setShowReward] = useState(false);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);

  // Load API Key and Check-in status on mount
  useEffect(() => {
    const storedKey = localStorage.getItem(STORAGE_KEY_API_KEY);
    if (storedKey) {
      setApiKey(storedKey);
    }

    // Check if user already checked in today
    const lastCheckInDate = localStorage.getItem(STORAGE_KEY_LAST_CHECKIN);
    const todayDate = new Date().toLocaleDateString();

    if (lastCheckInDate === todayDate) {
      setHasCheckedInToday(true);
    } else {
      // If dates don't match (e.g. it's a new day), we ensure state is false
      setHasCheckedInToday(false);
    }
  }, []);

  const calculateProgress = () => {
    if (tracks.length === 0) return 0;
    // Count how many target tracks have a matching timestamp in matchedStatus
    const matchedCount = tracks.filter(t => matchedStatus[t.id]).length;
    return Math.round((matchedCount / tracks.length) * 100);
  };

  const handleSync = async () => {
    if (!username) {
      setError('Please enter a Last.fm username');
      return;
    }
    
    setIsLoading(true);
    setError(null);

    // Save API Key to local storage
    if (apiKey) {
      localStorage.setItem(STORAGE_KEY_API_KEY, apiKey);
    }

    try {
      // Pass the apiKey to the service
      const recentTracks = await fetchRecentTracks(username, apiKey);
      
      const newMatches: Record<string, string> = {};

      tracks.forEach(target => {
        // Normalize for loose comparison
        const tArtist = target.artist.toLowerCase();
        const tTitle = target.title.toLowerCase();

        // Use find instead of some to get the track data
        const foundTrack = recentTracks.find(recent => {
          const rArtist = recent.artist['#text'].toLowerCase();
          const rTitle = recent.name.toLowerCase();
          return rArtist.includes(tArtist) && rTitle.includes(tTitle);
        });

        if (foundTrack) {
          let timeDisplay = 'Just now';
          
          if (foundTrack.date) {
            timeDisplay = foundTrack.date['#text'];
          } else if (foundTrack['@attr']?.nowplaying === 'true') {
            timeDisplay = 'Listening Now...';
          }
          
          newMatches[target.id] = timeDisplay;
        }
      });

      setMatchedStatus(newMatches);
      setSynced(true);
    } catch (err: any) {
      setError(err.message || 'Failed to sync. Please check username/API Key.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaim = () => {
    // Save today's date
    const todayDate = new Date().toLocaleDateString();
    localStorage.setItem(STORAGE_KEY_LAST_CHECKIN, todayDate);
    
    setHasCheckedInToday(true);
    setShowReward(true);
  };

  const progress = calculateProgress();
  const isComplete = progress === 100 && tracks.length > 0;

  // Render button text and style logic
  const renderButton = () => {
    if (hasCheckedInToday) {
      return (
        <button 
          disabled
          className="w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 bg-green-900/20 text-green-400 border border-green-500/30 cursor-not-allowed opacity-80"
        >
          <CalendarCheck size={24} />
          Check-In Complete for Today
        </button>
      );
    }

    if (isComplete) {
      return (
        <button 
          onClick={handleClaim}
          className="w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-500 bg-gradient-to-r from-neon-purple to-pink-600 text-white shadow-[0_0_30px_rgba(176,38,255,0.6)] scale-100 hover:scale-[1.02] cursor-pointer"
        >
          <Trophy size={24} className="text-yellow-300" />
          CLAIM DAILY CHECK-IN
        </button>
      );
    }

    return (
      <button 
        disabled
        className="w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 bg-white/5 text-gray-500 cursor-not-allowed border border-white/5"
      >
        <Trophy size={24} />
        Complete 100% to Check-In
      </button>
    );
  };

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
      <div className="w-full glass p-6 rounded-2xl mb-6 shadow-[0_0_30px_rgba(0,0,0,0.3)] space-y-4">
        
        {/* Username Input */}
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider flex items-center gap-1">
            <User size={12} /> Last.fm Username
          </label>
          <input 
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. user123"
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-green text-white placeholder-gray-500 transition-colors"
          />
        </div>

        {/* API Key Input */}
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider flex items-center gap-1">
             <Key size={12} /> Last.fm API Key
          </label>
          <input 
            type="password" 
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your API Key"
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-purple text-white placeholder-gray-500 transition-colors"
          />
          <p className="text-[10px] text-gray-500 mt-1">
            Don't have one? <a href="https://www.last.fm/api/account/create" target="_blank" rel="noreferrer" className="text-neon-purple hover:underline">Get it here</a>. Leave empty to use Mock Data.
          </p>
        </div>

        <button 
          onClick={handleSync}
          disabled={isLoading}
          className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all mt-2 ${
            isLoading 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
          }`}
        >
          <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
          {isLoading ? 'Sync Progress' : 'Sync Progress'}
        </button>
        
        {error && (
            <div className="mt-3 flex items-center gap-2 text-red-400 text-sm bg-red-900/20 p-2 rounded-lg animate-pulse">
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
                const matchTime = matchedStatus[track.id];
                const isListened = !!matchTime;
                
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
                        
                        {/* Display Play Time */}
                        {isListened && (
                            <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-neon-green/90 font-mono tracking-wide">
                                <Clock size={10} />
                                <span>{matchTime}</span>
                            </div>
                        )}
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

          {/* Dynamic Action Button */}
          {renderButton()}

        </div>
      )}

      {/* Reward Modal */}
      {showReward && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
            <div className="glass max-w-sm w-full p-8 rounded-3xl text-center relative border border-neon-purple/50 shadow-[0_0_50px_rgba(176,38,255,0.3)]">
                <button 
                    onClick={() => setShowReward(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                    <X size={24} />
                </button>
                
                <div className="mx-auto w-24 h-24 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(234,179,8,0.5)] animate-bounce">
                    <Trophy size={48} className="text-white drop-shadow-md" />
                </div>
                
                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-purple to-pink-500 mb-2 uppercase italic">
                    Check-In Complete!
                </h2>
                <p className="text-gray-300 mb-8 font-medium">
                    You've streamed all target tracks today. Great job keeping the community active!
                </p>
                
                <button
                    onClick={() => setShowReward(false)}
                    className="w-full py-3 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform shadow-lg"
                >
                    Awesome!
                </button>
            </div>
        </div>
      )}
    </div>
  );
};