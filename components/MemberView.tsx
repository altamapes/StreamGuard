import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, RefreshCw, Trophy, AlertCircle, Clock, CalendarCheck, LogOut, User as UserIcon, X, Music, ExternalLink, Settings, Edit2, Save, Key, Lock, Link as LinkIcon, Headphones, Mic2 } from 'lucide-react';
import { TargetTrack, User } from '../types';
import { fetchRecentTracks } from '../services/lastFmService';
import { storageService } from '../services/storage';

interface MemberViewProps {
  tracks: TargetTrack[];
  currentUser: User;
  spotifyId: string;
  onCheckIn: () => void;
  onUpdateUser: (user: User) => void;
  onLogout: () => void;
}

export const MemberView: React.FC<MemberViewProps> = ({ tracks, currentUser, spotifyId, onCheckIn, onUpdateUser, onLogout }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [synced, setSynced] = useState(false);
  
  const [matchedStatus, setMatchedStatus] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [showReward, setShowReward] = useState(false);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);

  // Profile Modal State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  // Edit Form State
  const [editLastFmUser, setEditLastFmUser] = useState('');
  const [editLastFmKey, setEditLastFmKey] = useState('');
  const [editPassword, setEditPassword] = useState('');
  
  // Personal Music State
  const [editPlaylistUrl, setEditPlaylistUrl] = useState('');
  const [editPersonalArtist, setEditPersonalArtist] = useState('');
  const [editPersonalTrack, setEditPersonalTrack] = useState('');

  // Initialize Check-in status based on currentUser data
  useEffect(() => {
    const todayDate = new Date().toLocaleDateString();
    
    // Check user's specific last check-in date
    if (currentUser.lastCheckInDate === todayDate) {
      setHasCheckedInToday(true);
    } else {
      setHasCheckedInToday(false);
    }
  }, [currentUser]); 

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
    onCheckIn(); 
    setHasCheckedInToday(true);
    setShowReward(true);
  };

  // Profile Handlers
  const openProfile = () => {
    setEditLastFmUser(currentUser.lastFmUsername);
    setEditLastFmKey(currentUser.lastFmApiKey);
    setEditPassword(currentUser.password);
    setEditPlaylistUrl(currentUser.personalPlaylistUrl || '');
    setEditPersonalArtist(currentUser.personalArtist || '');
    setEditPersonalTrack(currentUser.personalTrack || '');
    setIsEditingProfile(false);
    setIsProfileOpen(true);
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const updates = {
        lastFmUsername: editLastFmUser,
        lastFmApiKey: editLastFmKey,
        password: editPassword,
        personalPlaylistUrl: editPlaylistUrl,
        personalArtist: editPersonalArtist,
        personalTrack: editPersonalTrack
      };
      
      const updatedUser = await storageService.updateUserProfile(currentUser.id, updates);
      onUpdateUser(updatedUser); // Update parent state
      setIsEditingProfile(false);
      // Optional: Re-sync if credentials changed
      setSynced(false); 
      setMatchedStatus({});
    } catch (e: any) {
      alert('Failed to save profile: ' + e.message);
    } finally {
      setIsSavingProfile(false);
    }
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
      <div className="w-full flex justify-between items-center mb-6 bg-white/5 p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer" onClick={openProfile}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center font-bold text-lg uppercase shadow-lg shadow-purple-500/20">
            {currentUser.appUsername.charAt(0)}
          </div>
          <div>
            <div className="text-sm text-gray-400">Welcome back</div>
            <div className="font-bold text-white leading-none">{currentUser.appUsername}</div>
            <div className="text-[10px] text-neon-green mt-1 flex items-center gap-1 opacity-80">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online
            </div>
          </div>
        </div>
        <div 
          className="p-2 bg-white/5 rounded-full text-gray-400 group-hover:text-white"
        >
          <Settings size={20} />
        </div>
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
          {isLoading ? 'Syncing...' : 'Check Streams'}
        </button>
        
        {error && (
            <div className="mt-3 flex items-center gap-2 text-red-400 text-sm bg-red-900/20 p-2 rounded-lg border border-red-500/20">
                <AlertCircle size={16} />
                {error}
                <button 
                  onClick={openProfile}
                  className="ml-auto text-xs underline text-red-300 hover:text-white"
                >
                  Edit Profile
                </button>
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

      {/* USER PROFILE MODAL */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
          <div className="glass max-w-sm w-full rounded-3xl relative border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
             {/* Modal Header */}
             <div className="h-28 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 relative shrink-0">
                <button 
                  onClick={() => setIsProfileOpen(false)}
                  className="absolute top-4 right-4 bg-black/30 p-2 rounded-full text-white hover:bg-black/50 transition-colors z-10"
                >
                  <X size={20} />
                </button>
             </div>
             
             {/* Avatar (Moved OUTSIDE scrollable area to prevent clipping) */}
             <div className="absolute top-16 left-1/2 transform -translate-x-1/2 w-24 h-24 rounded-full bg-[#16133a] border-4 border-[#0f0c29] flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)] z-30">
                <div className="text-3xl font-bold text-white uppercase">{currentUser.appUsername.charAt(0)}</div>
                {!isEditingProfile && (
                    <button 
                    onClick={() => setIsEditingProfile(true)}
                    className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full border-2 border-[#0f0c29] hover:bg-blue-500 transition-colors shadow-lg"
                    title="Edit Profile"
                    >
                    <Edit2 size={12} />
                    </button>
                )}
             </div>
             
             {/* Scrollable Content */}
             <div className="px-6 pb-6 flex-1 overflow-y-auto custom-scrollbar pt-14">
                
                {/* Profile Info (Centered) */}
                <div className="mt-2 text-center">
                   <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                       {currentUser.appUsername}
                   </h2>
                   <div className="text-gray-400 text-xs mt-2 font-mono bg-white/5 px-3 py-1 rounded-full inline-block border border-white/5">
                       ID: {currentUser.id.slice(-6)}
                   </div>
                </div>

                {isEditingProfile ? (
                  /* EDIT MODE */
                  <div className="mt-8 space-y-4 animate-fade-in">
                     <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">My Music</label>
                        <div className="space-y-2">
                            {/* Artist Input */}
                            <div className="relative">
                                <Mic2 className="absolute left-3 top-3 text-gray-500" size={16} />
                                <input 
                                    type="text"
                                    value={editPersonalArtist}
                                    onChange={(e) => setEditPersonalArtist(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white focus:border-green-500 focus:outline-none placeholder-gray-600 text-sm"
                                    placeholder="Artist Name"
                                />
                            </div>
                            {/* Track Input */}
                            <div className="relative">
                                <Music className="absolute left-3 top-3 text-gray-500" size={16} />
                                <input 
                                    type="text"
                                    value={editPersonalTrack}
                                    onChange={(e) => setEditPersonalTrack(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white focus:border-green-500 focus:outline-none placeholder-gray-600 text-sm"
                                    placeholder="Track Title"
                                />
                            </div>
                            {/* Link Input */}
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-3 text-gray-500" size={16} />
                                <input 
                                    type="text"
                                    value={editPlaylistUrl}
                                    onChange={(e) => setEditPlaylistUrl(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white focus:border-green-500 focus:outline-none placeholder-gray-600 text-sm"
                                    placeholder="Spotify Link (https://...)"
                                />
                            </div>
                        </div>
                     </div>
                     
                     <div className="border-t border-white/10 my-4"></div>

                     <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Last.fm Username</label>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-3 text-gray-500" size={16} />
                          <input 
                            type="text"
                            value={editLastFmUser}
                            onChange={(e) => setEditLastFmUser(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white focus:border-neon-purple focus:outline-none"
                          />
                        </div>
                     </div>
                     <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Last.fm API Key</label>
                        <div className="relative">
                          <Key className="absolute left-3 top-3 text-gray-500" size={16} />
                          <input 
                            type="text"
                            value={editLastFmKey}
                            onChange={(e) => setEditLastFmKey(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white focus:border-neon-purple focus:outline-none font-mono text-xs"
                          />
                        </div>
                     </div>
                     <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">App Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 text-gray-500" size={16} />
                          <input 
                            type="text"
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white focus:border-neon-purple focus:outline-none"
                          />
                        </div>
                     </div>

                     <div className="flex gap-2 pt-2">
                        <button 
                          onClick={() => setIsEditingProfile(false)}
                          className="flex-1 py-2 rounded-xl bg-gray-700 text-gray-300 font-bold text-sm"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleSaveProfile}
                          disabled={isSavingProfile}
                          className="flex-1 py-2 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2"
                        >
                          {isSavingProfile ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                          Save Changes
                        </button>
                     </div>
                  </div>
                ) : (
                  /* VIEW MODE */
                  <div className="mt-8 space-y-4">
                     
                     {/* Personal Music Link */}
                     <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="w-10 h-10 rounded-full bg-blue-900/20 text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
                           <Headphones size={20} />
                        </div>
                        <div className="overflow-hidden w-full">
                           <div className="text-xs text-gray-500 font-bold uppercase truncate mb-0.5">My Music</div>
                           {currentUser.personalPlaylistUrl ? (
                               <a 
                                 href={currentUser.personalPlaylistUrl}
                                 target="_blank"
                                 rel="noopener noreferrer" 
                                 className="group block"
                               >
                                   <div className="font-bold text-blue-400 group-hover:text-blue-300 group-hover:underline truncate text-lg leading-tight">
                                       {currentUser.personalTrack || 'My Playlist'}
                                   </div>
                                   {currentUser.personalArtist && (
                                       <div className="text-sm text-gray-400 truncate">
                                           {currentUser.personalArtist}
                                       </div>
                                   )}
                                   {/* Fallback if no artist/track but url exists */}
                                   {!currentUser.personalTrack && !currentUser.personalArtist && (
                                       <div className="text-xs text-blue-500 flex items-center gap-1 mt-1">
                                           Open Link <ExternalLink size={10} />
                                       </div>
                                   )}
                               </a>
                           ) : (
                               <button 
                                onClick={() => setIsEditingProfile(true)}
                                className="text-sm text-gray-500 italic hover:text-white transition-colors text-left"
                               >
                                   Tap to set your music...
                               </button>
                           )}
                        </div>
                     </div>

                     <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="w-10 h-10 rounded-full bg-red-900/20 text-red-500 flex items-center justify-center border border-red-500/20 shrink-0">
                           <Music size={20} />
                        </div>
                        <div className="overflow-hidden">
                           <div className="text-xs text-gray-500 font-bold uppercase truncate">Last.fm Connected</div>
                           <div className="font-bold text-white truncate">{currentUser.lastFmUsername}</div>
                        </div>
                     </div>

                     <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="w-10 h-10 rounded-full bg-green-900/20 text-green-500 flex items-center justify-center border border-green-500/20 shrink-0">
                           <CalendarCheck size={20} />
                        </div>
                        <div>
                           <div className="text-xs text-gray-500 font-bold uppercase">Last Check-in</div>
                           <div className="font-bold text-white">{currentUser.lastCheckInDate || 'Not checked in yet'}</div>
                        </div>
                     </div>
                  </div>
                )}
             </div>

             {/* Footer Actions */}
             <div className="p-6 pt-0 mt-auto shrink-0">
                <button 
                  onClick={() => {
                    setIsProfileOpen(false);
                    onLogout();
                  }}
                  className="w-full py-3 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-900/10 transition-colors flex items-center justify-center gap-2 font-bold text-sm"
                >
                   <LogOut size={18} /> Logout
                </button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};