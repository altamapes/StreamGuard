import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, RefreshCw, Trophy, AlertCircle, Clock, CalendarCheck, LogOut, User as UserIcon, X, Music, ExternalLink } from 'lucide-react';
import { TargetTrack, User } from '../types';
import { fetchRecentTracks } from '../services/lastFmService';

interface MemberViewProps {
  tracks: TargetTrack[];
  currentUser: User;
  spotifyId: string; // Add this prop
  onCheckIn: () => void; // Parent handles the DB update
  onLogout: () => void;
}

export const MemberView: React.FC<MemberViewProps> = ({ tracks, currentUser, spotifyId, onCheckIn, onLogout }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [synced, setSynced] = useState(false);
  
  const [matchedStatus, setMatchedStatus] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [showReward, setShowReward] = useState(false);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);

  // Initialize Check-in status based on currentUser data
  useEffect(() => {
    const todayDate = new Date().toLocaleDateString();
    
    // Check user's specific last check-in date
    if (currentUser.lastCheckInDate === todayDate) {
      setHasCheckedInToday(true);
    } else {
      setHasCheckedInToday(false);
    }
  }, [currentUser]); // Re-run if user changes or updates

  const calculateProgress = () => {
    if (tracks.length === 0) return 0;
    const matchedCount = tracks.filter(t => matchedStatus[t.id]).length;
    return Math.round((matchedCount / tracks.length) * 100);
  };

  const handleSync = async () => {
    if (!currentUser.lastFmUsername) {
      setError('No Last.fm username found in profile.');
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      // Use credentials from the logged-in user
      const recentTracks = await fetchRecentTracks(currentUser.lastFmUsername, currentUser.lastFmApiKey);
      
      const newMatches: Record<string, string> = {};

      tracks.forEach(target => {
        const tArtist = target.artist.toLowerCase();
        const tTitle = target.title.toLowerCase();

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
      setError(err.message || 'Failed to sync. Please check API Key in your profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaim = () => {
    // Call parent to update database
    onCheckIn(); 
    setHasCheckedInToday(true);
    setShowReward(true);
  };

  const progress = calculateProgress();
  const isComplete = progress === 100 && tracks.length > 0;

  const renderButton = () => {
    if (hasCheckedInToday) {
      return (
        <button 
          disabled
          className="w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 bg-green-900/20 text-green-400 border border-green-500/30 cursor-not-allowed opacity-80"
        >
          <CalendarCheck size={24} />
          Checked In for Today
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
      
      {/* User Header */}
      <div className="w-full flex justify-between items-center mb-6 bg-white/5 p-4 rounded-2xl border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center font-bold text-lg uppercase">
            {currentUser.appUsername.charAt(0)}
          </div>
          <div>
            <div className="text-sm text-gray-400">Logged in as</div>
            <div className="font-bold text-white leading-none">{currentUser.appUsername}</div>
            <div className="text-xs text-neon-green mt-1 flex items-center gap-1">
              <UserIcon size={10} /> {currentUser.lastFmUsername}
            </div>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>

      <div className="mb-4 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-blue-400 drop-shadow-sm">
          StreamGuard
        </h1>
      </div>

      {/* Sync Button Only (No Inputs) */}
      <div className="w-full glass p-6 rounded-2xl mb-6 shadow-[0_0_30px_rgba(0,0,0,0.3)]">
        <button 
          onClick={handleSync}
          disabled={isLoading}
          className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
            isLoading 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
          }`}
        >
          <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
          {isLoading ? 'Sync Progress' : 'Check Streams'}
        </button>
        
        {error && (
            <div className="mt-3 flex items-center gap-2 text-red-400 text-sm bg-red-900/20 p-2 rounded-lg">
                <AlertCircle size={16} />
                {error}
            </div>
        )}
        
        {/* Spotify Link Button */}
        <div className="mt-6 pt-6 border-t border-white/10">
            <h4 className="text-xs text-gray-400 font-bold uppercase mb-3 flex items-center gap-2">
                <Music size={12} className="text-green-500" /> Target Playlist
            </h4>
            <a 
                href={`https://open.spotify.com/playlist/${spotifyId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(29,185,84,0.4)] hover:scale-[1.02]"
            >
                <Music size={20} fill="currentColor" />
                Open Playlist in Spotify
                <ExternalLink size={16} className="opacity-60 ml-1" />
            </a>
        </div>
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
                        <div className={`font-bold flex flex-wrap items-center gap-2 ${isListened ? 'text-green-300' : 'text-white'}`}>
                        <span>{track.title}</span>
                        {isListened && (
                             <span className="text-[10px] font-normal text-neon-green bg-green-900/40 px-2 py-0.5 rounded-full flex items-center gap-1 border border-green-500/20">
                                <Clock size={10} /> {matchTime}
                             </span>
                        )}
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
                    See you tomorrow, {currentUser.appUsername}!
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