import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Save, ArrowLeft, Plus, Settings, Database, Cloud, CloudOff, Download, Upload, ListMusic, Loader2, RefreshCw, Users, CheckCircle2, Clock, Music } from 'lucide-react';
import { TargetTrack, CloudConfig, User } from '../types';
import { storageService } from '../services/storage';
import { DEFAULT_CLOUD_CONFIG } from '../constants';

interface AdminPanelProps {
  tracks: TargetTrack[];
  spotifyId: string;
  onSave: (tracks: TargetTrack[]) => void;
  onSaveSpotify: (id: string) => void;
  onExit: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ tracks, spotifyId, onSave, onSaveSpotify, onExit }) => {
  const [activeTab, setActiveTab] = useState<'playlist' | 'users' | 'settings'>('playlist');
  
  // Playlist State
  const [localTracks, setLocalTracks] = useState<TargetTrack[]>(tracks);
  const [newArtist, setNewArtist] = useState('');
  const [newTitle, setNewTitle] = useState('');
  
  // Spotify State
  const [localSpotifyId, setLocalSpotifyId] = useState(spotifyId);
  const [spotifyInput, setSpotifyInput] = useState(`https://open.spotify.com/playlist/${spotifyId}`);

  // Users State
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Settings State
  const [cloudConfig, setCloudConfig] = useState<CloudConfig>({ enabled: false, binId: '', apiKey: '' });
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if defaults are actually present in the code
  const hasDefaults = !!(DEFAULT_CLOUD_CONFIG.binId && DEFAULT_CLOUD_CONFIG.apiKey);

  useEffect(() => {
    // Load existing cloud config when panel opens
    const config = storageService.getCloudConfig();
    if (config) {
      setCloudConfig(config);
    }
  }, []);

  // Fetch Users when switching to 'users' tab
  useEffect(() => {
    if (activeTab === 'users') {
        fetchUsers();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
        const fetchedUsers = await storageService.getUsers();
        setUsersList(fetchedUsers);
    } catch (e) {
        console.error("Failed to fetch users", e);
    } finally {
        setIsLoadingUsers(false);
    }
  };

  // --- PLAYLIST LOGIC ---
  const handleAddTrack = () => {
    if (!newArtist.trim() || !newTitle.trim()) return;
    const newTrack: TargetTrack = {
      id: Date.now().toString(),
      artist: newArtist.trim(),
      title: newTitle.trim(),
    };
    setLocalTracks([...localTracks, newTrack]);
    setNewArtist('');
    setNewTitle('');
  };

  const handleRemoveTrack = (id: string) => {
    setLocalTracks(localTracks.filter(t => t.id !== id));
  };

  const handleSavePlaylist = () => {
    onSave(localTracks);
  };

  const handleSpotifyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSpotifyInput(val);
    
    // Extract ID from URL
    // Supports: https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=...
    const match = val.match(/playlist\/([a-zA-Z0-9]+)/);
    if (match && match[1]) {
        setLocalSpotifyId(match[1]);
    } else if (!val.includes('http')) {
        // Assume user pasted just the ID
        setLocalSpotifyId(val);
    }
  };

  const handleSaveSpotify = () => {
      onSaveSpotify(localSpotifyId);
      alert('Spotify Playlist updated!');
  };

  // --- SETTINGS LOGIC ---
  const handleSaveCloudConfig = async () => {
    setSettingsMsg(null);
    if (!cloudConfig.binId || !cloudConfig.apiKey) {
        setSettingsMsg('Please enter both Bin ID and API Key.');
        return;
    }

    setIsVerifying(true);
    
    // Verify connection first
    const verification = await storageService.verifyConnection(cloudConfig.binId, cloudConfig.apiKey);
    
    setIsVerifying(false);

    if (verification.valid) {
      const newConfig = { ...cloudConfig, enabled: true };
      storageService.saveCloudConfig(newConfig);
      setCloudConfig(newConfig);
      setSettingsMsg('SUCCESS: Cloud Connected! Please reload the app.');
    } else {
      setSettingsMsg(`ERROR: ${verification.message}`);
    }
  };

  const handleDisconnectOrReset = () => {
    storageService.disconnectCloud(); // Clears LocalStorage
    
    if (hasDefaults) {
        // If defaults exist, revert UI to defaults
        setCloudConfig(DEFAULT_CLOUD_CONFIG);
        setSettingsMsg('Reset to Default Configuration.');
    } else {
        // If no defaults, clear UI completely
        setCloudConfig({ enabled: false, binId: '', apiKey: '' });
        setSettingsMsg('Cloud Disconnected. Using Local Storage.');
    }
  };

  const handleExportData = () => {
    try {
      const data = storageService.exportData();
      const backupData = {
        version: 1,
        timestamp: new Date().toISOString(),
        users: data.users ? JSON.parse(data.users) : [],
        playlist: data.tracks ? JSON.parse(data.tracks) : [],
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `streamguard_admin_backup.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSettingsMsg('Backup downloaded.');
    } catch (err) { setSettingsMsg('Failed to generate backup.'); }
  };

  const handleImportClick = () => { fileInputRef.current?.click(); };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (window.confirm('WARNING: This will overwrite ALL data (users & playlist). Continue?')) {
            storageService.importData(
              json.users ? JSON.stringify(json.users) : null,
              json.playlist ? JSON.stringify(json.playlist) : null
            );
            alert('Data restored successfully. Reloading...');
            window.location.reload();
        }
      } catch (err) { alert('Invalid backup file.'); }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Helper to check if user checked in today
  const isCheckedInToday = (dateString: string | null) => {
    if (!dateString) return false;
    const today = new Date().toLocaleDateString();
    return dateString === today;
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          Admin Dashboard
        </h2>
        <button 
          onClick={onExit}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-sm font-medium self-start md:self-auto"
        >
          <ArrowLeft size={16} />
          Exit Admin
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 md:gap-4 mb-6 overflow-x-auto">
        <button 
            onClick={() => setActiveTab('playlist')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${activeTab === 'playlist' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
        >
            <ListMusic size={18} /> Playlist
        </button>
        <button 
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${activeTab === 'users' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
        >
            <Users size={18} /> User Activity
        </button>
        <button 
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
        >
            <Settings size={18} /> Settings
        </button>
      </div>

      {activeTab === 'playlist' && (
        <>
            {/* Spotify Config */}
            <div className="glass p-6 rounded-2xl mb-8 border border-green-500/20 shadow-lg shadow-green-900/20">
                <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
                    <Music size={20} /> Spotify Integration
                </h3>
                <div className="flex flex-col md:flex-row gap-4">
                    <input 
                        type="text" 
                        placeholder="Paste Spotify Playlist Link (e.g. https://open.spotify.com/playlist/...)"
                        value={spotifyInput}
                        onChange={handleSpotifyChange}
                        className="flex-[2] bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 transition-colors text-sm"
                    />
                    <button 
                        onClick={handleSaveSpotify}
                        className="bg-green-600 hover:bg-green-500 text-white rounded-xl px-6 py-3 font-bold transition-all flex items-center justify-center gap-2"
                    >
                        <Save size={18} /> Update Playlist
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    This playlist will be embedded in the Member View for streaming.
                    Current ID: <span className="font-mono text-gray-400">{localSpotifyId}</span>
                </p>
            </div>

            {/* Add New Track Form */}
            <div className="glass p-6 rounded-2xl mb-8 shadow-lg shadow-purple-900/20">
                <h3 className="text-lg font-semibold text-purple-300 mb-4">Add Target Track</h3>
                <div className="flex flex-col md:flex-row gap-4">
                <input 
                    type="text" 
                    placeholder="Artist Name"
                    value={newArtist}
                    onChange={(e) => setNewArtist(e.target.value)}
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
                />
                <input 
                    type="text" 
                    placeholder="Track Title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
                />
                <button 
                    onClick={handleAddTrack}
                    className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl px-6 py-3 font-bold transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)] flex items-center justify-center gap-2"
                >
                    <Plus size={20} />
                    Add
                </button>
                </div>
            </div>

            {/* Track List */}
            <div className="glass p-6 rounded-2xl shadow-lg shadow-purple-900/20">
                <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-purple-300">Current Playlist ({localTracks.length})</h3>
                <button 
                    onClick={handleSavePlaylist}
                    className="flex items-center gap-2 bg-green-500/80 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-[0_0_15px_rgba(74,222,128,0.4)]"
                >
                    <Save size={18} />
                    Save Changes
                </button>
                </div>

                <div className="space-y-3">
                {localTracks.length === 0 ? (
                    <p className="text-center text-gray-400 py-8 italic">No tracks in the playlist.</p>
                ) : (
                    localTracks.map((track) => (
                    <div key={track.id} className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-white/5 hover:border-purple-500/30 transition-all">
                        <div>
                        <div className="font-bold text-white">{track.title}</div>
                        <div className="text-sm text-gray-400">{track.artist}</div>
                        </div>
                        <button 
                        onClick={() => handleRemoveTrack(track.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-2 rounded-lg transition-colors"
                        >
                        <Trash2 size={20} />
                        </button>
                    </div>
                    ))
                )}
                </div>
            </div>
        </>
      )}

      {activeTab === 'users' && (
        <div className="glass p-6 rounded-2xl shadow-lg shadow-emerald-900/20 animate-fade-in">
           <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                        <Users /> Community Activity
                    </h3>
                    <p className="text-sm text-gray-400">Monitor who has completed their daily check-in.</p>
                </div>
                <button 
                    onClick={fetchUsers} 
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    title="Refresh List"
                >
                    <RefreshCw size={20} className={isLoadingUsers ? 'animate-spin' : ''} />
                </button>
           </div>

           {isLoadingUsers ? (
               <div className="py-12 flex justify-center text-emerald-500">
                   <Loader2 className="animate-spin" size={32} />
               </div>
           ) : (
               <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                       <thead>
                           <tr className="text-gray-400 border-b border-white/10 text-sm uppercase tracking-wider">
                               <th className="pb-3 pl-2">App User</th>
                               <th className="pb-3">Last.fm</th>
                               <th className="pb-3 text-center">Today's Status</th>
                               <th className="pb-3 text-right pr-2">Last Active</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-white/5">
                           {usersList.length === 0 ? (
                               <tr>
                                   <td colSpan={4} className="text-center py-8 text-gray-500 italic">
                                       No registered users found.
                                   </td>
                               </tr>
                           ) : (
                               usersList.map((user) => {
                                   const checkedIn = isCheckedInToday(user.lastCheckInDate);
                                   return (
                                       <tr key={user.id} className="group hover:bg-white/5 transition-colors">
                                           <td className="py-4 pl-2 font-bold text-white">{user.appUsername}</td>
                                           <td className="py-4 text-gray-400 text-sm font-mono">{user.lastFmUsername}</td>
                                           <td className="py-4 flex justify-center">
                                               {checkedIn ? (
                                                   <div className="flex items-center gap-1 bg-green-900/30 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/20">
                                                       <CheckCircle2 size={14} /> Checked In
                                                   </div>
                                               ) : (
                                                   <div className="flex items-center gap-1 bg-red-900/20 text-gray-400 px-3 py-1 rounded-full text-xs font-bold border border-white/5">
                                                        <Clock size={14} /> Pending
                                                   </div>
                                               )}
                                           </td>
                                           <td className="py-4 text-right pr-2 text-sm text-gray-500">
                                               {user.lastCheckInDate || 'Never'}
                                           </td>
                                       </tr>
                                   );
                               })
                           )}
                       </tbody>
                   </table>
               </div>
           )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="animate-fade-in space-y-6">
            
            {/* Cloud Config Section */}
            <div className="glass p-6 rounded-2xl border border-blue-500/20">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-400">
                    <Cloud /> Database Connection
                </h3>
                
                {/* Default Config Banner */}
                {hasDefaults && (
                    <div className="mb-6 p-4 bg-blue-900/20 border border-blue-400/30 rounded-xl flex items-center justify-between gap-3">
                        <div className="text-sm text-blue-200">
                            <strong>System Default Active:</strong> Using hardcoded connection keys.
                        </div>
                    </div>
                )}

                <p className="text-sm text-gray-400 mb-6">
                    Connect to JSONBin.io to allow users to sync data across different devices.
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 block mb-1">Bin ID</label>
                        <input 
                            type="text" 
                            value={cloudConfig.binId} 
                            onChange={(e) => setCloudConfig({...cloudConfig, binId: e.target.value})}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none font-mono"
                            placeholder="e.g. 65d4f..."
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 block mb-1">Master Key (X-Master-Key)</label>
                        <input 
                            type="password" 
                            value={cloudConfig.apiKey} 
                            onChange={(e) => setCloudConfig({...cloudConfig, apiKey: e.target.value})}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none font-mono"
                            placeholder="e.g. $2a$10$..."
                        />
                    </div>
                    
                    <div className="flex gap-4 pt-2">
                        <button 
                            onClick={handleSaveCloudConfig}
                            disabled={isVerifying}
                            className={`flex-1 py-3 rounded-xl font-bold text-white transition-colors flex items-center justify-center gap-2 ${isVerifying ? 'bg-blue-800' : 'bg-blue-600 hover:bg-blue-500'}`}
                        >
                            {isVerifying && <Loader2 className="animate-spin" size={18} />}
                            {cloudConfig.enabled ? 'Update Connection' : 'Connect Cloud'}
                        </button>
                        
                        {cloudConfig.enabled && !isVerifying && (
                            <button 
                                onClick={handleDisconnectOrReset}
                                className={`px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 ${hasDefaults ? 'bg-yellow-600/50 text-yellow-200 hover:bg-yellow-600' : 'bg-red-900/50 text-red-300 hover:bg-red-900'}`}
                            >
                                {hasDefaults ? <RefreshCw size={18} /> : <CloudOff size={18} />}
                                {hasDefaults ? 'Reset to Default' : 'Disconnect'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Backup Section */}
            <div className="glass p-6 rounded-2xl border border-white/10">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                    <Database /> Manual Backup
                </h3>
                <p className="text-sm text-gray-400 mb-6">
                    Download a local copy of the entire database (Users + Playlist) or restore from a file.
                </p>

                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={handleExportData}
                        className="py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl flex flex-col items-center justify-center gap-2 transition-all"
                    >
                        <Download size={24} className="text-neon-green" /> 
                        <span className="font-bold">Backup to JSON</span>
                    </button>

                    <div className="relative">
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                        <button 
                            onClick={handleImportClick}
                            className="w-full h-full py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl flex flex-col items-center justify-center gap-2 transition-all"
                        >
                            <Upload size={24} className="text-orange-400" /> 
                            <span className="font-bold">Restore from JSON</span>
                        </button>
                    </div>
                </div>
            </div>

            {settingsMsg && (
                <div className={`p-4 rounded-xl text-center font-medium border animate-pulse ${
                    settingsMsg.includes('SUCCESS') ? 'bg-green-900/20 border-green-500/30 text-green-300' : 
                    settingsMsg.includes('ERROR') ? 'bg-red-900/20 border-red-500/30 text-red-300' :
                    'bg-white/10 border-white/20 text-white'
                }`}>
                    {settingsMsg}
                </div>
            )}
        </div>
      )}
    </div>
  );
};