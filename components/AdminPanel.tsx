import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Save, ArrowLeft, Plus, Settings, Database, Cloud, CloudOff, Download, Upload, ListMusic, Loader2, RefreshCw, Users, CheckCircle2, Clock, Music, Search, Filter, XCircle, BarChart3, Calendar, Copy, Key, Lock, ShieldCheck, Eye, X, User as UserIcon, Link as LinkIcon, Headphones, CalendarCheck } from 'lucide-react';
import { TargetTrack, CloudConfig, User, WeeklySchedule } from '../types';
import { storageService } from '../services/storage';
import { DEFAULT_CLOUD_CONFIG, DEFAULT_SPOTIFY_ID } from '../constants';

interface AdminPanelProps {
  onExit: () => void;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const AdminPanel: React.FC<AdminPanelProps> = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState<'playlist' | 'users' | 'settings'>('playlist');
  
  // Weekly Schedule State
  const [schedule, setSchedule] = useState<WeeklySchedule>({});
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(new Date().getDay()); // Default to today
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);

  // Form State (Derived from Schedule)
  const [currentTracks, setCurrentTracks] = useState<TargetTrack[]>([]);
  const [currentSpotifyId, setCurrentSpotifyId] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [spotifyInput, setSpotifyInput] = useState('');

  // Users State
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'checked' | 'missing'>('all');
  const [viewingUser, setViewingUser] = useState<User | null>(null); // State for modal

  // Settings State
  const [cloudConfig, setCloudConfig] = useState<CloudConfig>({ enabled: false, binId: '', apiKey: '' });
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Admin PIN State
  const [newAdminPin, setNewAdminPin] = useState('');
  const [isSavingPin, setIsSavingPin] = useState(false);

  const hasDefaults = !!(DEFAULT_CLOUD_CONFIG.binId && DEFAULT_CLOUD_CONFIG.apiKey);

  // --- INITIALIZATION ---
  useEffect(() => {
    const init = async () => {
        // Load Cloud Config
        const config = storageService.getCloudConfig();
        if (config) setCloudConfig(config);

        // Load Schedule
        setIsLoadingSchedule(true);
        try {
            const data = await storageService.getWeeklySchedule();
            setSchedule(data);
            
            // Set initial state for today
            const today = new Date().getDay();
            const todayConfig = data[today] || { tracks: [], spotifyId: DEFAULT_SPOTIFY_ID };
            
            setCurrentTracks(todayConfig.tracks || []);
            setCurrentSpotifyId(todayConfig.spotifyId || DEFAULT_SPOTIFY_ID);
            setSpotifyInput(todayConfig.spotifyId ? `https://open.spotify.com/playlist/${todayConfig.spotifyId}` : '');
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingSchedule(false);
        }
    };
    init();
  }, []);

  // Fetch Users when switching to 'users' tab
  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
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

  // --- PLAYLIST LOGIC (WEEKLY) ---

  const handleDayChange = (dayIndex: number) => {
      // 1. Save current work temporarily to state (not DB yet)
      const updatedSchedule = { ...schedule };
      updatedSchedule[selectedDayIndex] = {
          tracks: currentTracks,
          spotifyId: currentSpotifyId
      };
      setSchedule(updatedSchedule);

      // 2. Load new day
      setSelectedDayIndex(dayIndex);
      const dayConfig = updatedSchedule[dayIndex] || { tracks: [], spotifyId: DEFAULT_SPOTIFY_ID };
      setCurrentTracks(dayConfig.tracks || []);
      setCurrentSpotifyId(dayConfig.spotifyId || DEFAULT_SPOTIFY_ID);
      setSpotifyInput(dayConfig.spotifyId ? `https://open.spotify.com/playlist/${dayConfig.spotifyId}` : '');
  };

  const handleAddTrack = () => {
    if (!newArtist.trim() || !newTitle.trim()) return;
    const newTrack: TargetTrack = {
      id: Date.now().toString(),
      artist: newArtist.trim(),
      title: newTitle.trim(),
    };
    setCurrentTracks([...currentTracks, newTrack]);
    setNewArtist('');
    setNewTitle('');
  };

  const handleRemoveTrack = (id: string) => {
    setCurrentTracks(currentTracks.filter(t => t.id !== id));
  };

  const handleSpotifyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSpotifyInput(val);
    const match = val.match(/playlist\/([a-zA-Z0-9]+)/);
    if (match && match[1]) {
        setCurrentSpotifyId(match[1]);
    } else if (!val.includes('http')) {
        setCurrentSpotifyId(val);
    }
  };

  const handleCopyFromPreviousDay = () => {
      // Logic to copy tracks from yesterday (or any filled day)
      const prevDayIndex = selectedDayIndex === 0 ? 6 : selectedDayIndex - 1;
      const prevDayConfig = schedule[prevDayIndex];
      if (prevDayConfig) {
          if (confirm(`Overwrite ${DAYS[selectedDayIndex]} with data from ${DAYS[prevDayIndex]}?`)) {
            setCurrentTracks(prevDayConfig.tracks || []);
            setCurrentSpotifyId(prevDayConfig.spotifyId || DEFAULT_SPOTIFY_ID);
            setSpotifyInput(prevDayConfig.spotifyId ? `https://open.spotify.com/playlist/${prevDayConfig.spotifyId}` : '');
          }
      } else {
          alert('Previous day has no data.');
      }
  };

  const handleSaveSchedule = async () => {
      // Update schedule object with current view data
      const finalSchedule = { ...schedule };
      finalSchedule[selectedDayIndex] = {
          tracks: currentTracks,
          spotifyId: currentSpotifyId
      };
      
      setSchedule(finalSchedule);
      setIsLoadingSchedule(true);
      try {
          await storageService.saveWeeklySchedule(finalSchedule);
          alert('Weekly Schedule Saved Successfully!');
      } catch (e) {
          alert('Failed to save schedule.');
      } finally {
          setIsLoadingSchedule(false);
      }
  };

  // --- SETTINGS LOGIC ---
  const handleSaveCloudConfig = async () => {
    setSettingsMsg(null);
    if (!cloudConfig.binId || !cloudConfig.apiKey) {
        setSettingsMsg('Please enter both Bin ID and API Key.');
        return;
    }

    setIsVerifying(true);
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
    storageService.disconnectCloud();
    if (hasDefaults) {
        setCloudConfig(DEFAULT_CLOUD_CONFIG);
        setSettingsMsg('Reset to Default Configuration.');
    } else {
        setCloudConfig({ enabled: false, binId: '', apiKey: '' });
        setSettingsMsg('Cloud Disconnected. Using Local Storage.');
    }
  };

  const handleChangeAdminPin = async () => {
      if (!newAdminPin || newAdminPin.length < 4) {
          setSettingsMsg('ERROR: PIN must be at least 4 characters.');
          return;
      }
      setIsSavingPin(true);
      try {
          await storageService.saveAdminPin(newAdminPin);
          setSettingsMsg('SUCCESS: Admin PIN Updated!');
          setNewAdminPin('');
      } catch (e) {
          setSettingsMsg('ERROR: Failed to save PIN.');
      } finally {
          setIsSavingPin(false);
      }
  };

  const handleExportData = () => {
    try {
      const data = storageService.exportData();
      const backupData = {
        version: 2,
        timestamp: new Date().toISOString(),
        users: data.users ? JSON.parse(data.users) : [],
        schedule: data.schedule ? JSON.parse(data.schedule) : {},
        adminPin: data.adminPin || null
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `streamguard_backup.json`;
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
        if (window.confirm('WARNING: This will overwrite ALL data (including Admin PIN). Continue?')) {
            storageService.importData(
              json.users ? JSON.stringify(json.users) : null,
              null, // Legacy tracks ignored
              json.schedule ? JSON.stringify(json.schedule) : null,
              json.adminPin || null
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

  // --- FILTER & STATS LOGIC ---
  const getFilteredUsers = () => {
    return usersList.filter(user => {
      const matchesSearch = user.appUsername.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            user.lastFmUsername.toLowerCase().includes(searchQuery.toLowerCase());
      const checkedIn = isCheckedInToday(user.lastCheckInDate);
      if (filterStatus === 'checked') return matchesSearch && checkedIn;
      if (filterStatus === 'missing') return matchesSearch && !checkedIn;
      return matchesSearch;
    });
  };

  const stats = {
    total: usersList.length,
    checkedIn: usersList.filter(u => isCheckedInToday(u.lastCheckInDate)).length,
    missing: 0
  };
  stats.missing = stats.total - stats.checkedIn;
  const completionRate = stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0;
  const filteredUsers = getFilteredUsers();
  const todayDateDisplay = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 animate-fade-in relative">
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
            <ListMusic size={18} /> Schedule
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
            {/* WEEKLY SCHEDULE TABS */}
            <div className="mb-6 overflow-x-auto custom-scrollbar">
                <div className="flex gap-2 pb-2">
                    {DAYS.map((day, index) => {
                        const isToday = index === new Date().getDay();
                        // Determine if we should show the dot (data exists)
                        // If it's the currently selected day, check currentTracks
                        // If it's another day, check the schedule object
                        const isSelected = selectedDayIndex === index;
                        let hasTracks = false;
                        if (isSelected) {
                            hasTracks = currentTracks.length > 0;
                        } else {
                            hasTracks = schedule[index]?.tracks && schedule[index].tracks.length > 0;
                        }

                        return (
                            <button
                                key={day}
                                onClick={() => handleDayChange(index)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap border flex items-center gap-2 ${
                                    isSelected 
                                    ? 'bg-white text-black border-white scale-105' 
                                    : 'bg-black/40 text-gray-400 border-white/10 hover:border-purple-500 hover:text-purple-300'
                                }`}
                            >
                                {day} {isToday && '(Today)'}
                                {hasTracks && (
                                    <div 
                                        className={`w-2 h-2 rounded-full ${isSelected ? 'bg-green-600' : 'bg-green-500'} shadow-[0_0_8px_rgba(34,197,94,0.8)]`} 
                                        title="Playlist Configured"
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex items-center justify-between mb-4">
                 <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    Editing: <span className="text-purple-400">{DAYS[selectedDayIndex]}</span>
                 </h3>
                 <button 
                    onClick={handleCopyFromPreviousDay}
                    className="text-xs flex items-center gap-1 text-gray-400 hover:text-white bg-white/5 px-3 py-1.5 rounded-lg border border-white/10"
                    title="Copy settings from yesterday"
                 >
                     <Copy size={12} /> Copy Previous
                 </button>
            </div>

            {/* Spotify Config */}
            <div className="glass p-6 rounded-2xl mb-6 border border-green-500/20 shadow-lg shadow-green-900/20">
                <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
                    <Music size={20} /> Spotify Integration ({DAYS[selectedDayIndex]})
                </h3>
                <div className="flex flex-col md:flex-row gap-4">
                    <input 
                        type="text" 
                        placeholder="Paste Spotify Playlist Link..."
                        value={spotifyInput}
                        onChange={handleSpotifyChange}
                        className="flex-[2] bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 transition-colors text-sm"
                    />
                </div>
            </div>

            {/* Add New Track Form */}
            <div className="glass p-6 rounded-2xl mb-6 shadow-lg shadow-purple-900/20">
                <h3 className="text-lg font-semibold text-purple-300 mb-4">Add Track for {DAYS[selectedDayIndex]}</h3>
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
                <h3 className="text-lg font-semibold text-purple-300">Playlist for {DAYS[selectedDayIndex]} ({currentTracks.length})</h3>
                <button 
                    onClick={handleSaveSchedule}
                    className="flex items-center gap-2 bg-green-500/80 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold transition-all shadow-[0_0_15px_rgba(74,222,128,0.4)]"
                >
                    {isLoadingSchedule ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    Save Schedule
                </button>
                </div>

                <div className="space-y-3">
                {currentTracks.length === 0 ? (
                    <p className="text-center text-gray-400 py-8 italic border border-dashed border-white/10 rounded-xl">
                        No tracks set for {DAYS[selectedDayIndex]}.
                    </p>
                ) : (
                    currentTracks.map((track) => (
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
        <div className="space-y-6 animate-fade-in">
           {/* Summary Stats Cards */}
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="glass p-4 rounded-xl flex flex-col items-center justify-center border border-white/10">
                   <div className="text-gray-400 text-xs font-bold uppercase mb-1">Total Users</div>
                   <div className="text-2xl font-bold text-white">{stats.total}</div>
               </div>
               <div className="glass p-4 rounded-xl flex flex-col items-center justify-center border border-green-500/20 bg-green-900/10">
                   <div className="text-green-400 text-xs font-bold uppercase mb-1">Checked In (Today)</div>
                   <div className="text-2xl font-bold text-green-400">{stats.checkedIn}</div>
               </div>
               <div className="glass p-4 rounded-xl flex flex-col items-center justify-center border border-red-500/20 bg-red-900/10">
                   <div className="text-red-400 text-xs font-bold uppercase mb-1">Missing (Today)</div>
                   <div className="text-2xl font-bold text-red-400">{stats.missing}</div>
               </div>
               <div className="glass p-4 rounded-xl flex flex-col items-center justify-center border border-blue-500/20">
                   <div className="text-blue-400 text-xs font-bold uppercase mb-1">Completion</div>
                   <div className="text-2xl font-bold text-blue-400">{completionRate}%</div>
               </div>
           </div>

           <div className="glass p-6 rounded-2xl shadow-lg shadow-emerald-900/20">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                            <Users /> Community Activity
                            <span className="text-sm font-normal text-gray-400 ml-2 border-l border-white/20 pl-3 flex items-center gap-1">
                                <Calendar size={14} /> {todayDateDisplay}
                            </span>
                        </h3>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <button 
                            onClick={fetchUsers} 
                            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                            title="Refresh List"
                        >
                            <RefreshCw size={20} className={isLoadingUsers ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
                
                {/* Search and Filters Bar */}
                <div className="flex flex-col md:flex-row gap-3 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3 text-gray-500" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search by username..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-emerald-500 text-white placeholder-gray-600 transition-colors"
                        />
                    </div>
                    <div className="flex bg-black/40 rounded-xl p-1 border border-white/10">
                        <button 
                            onClick={() => setFilterStatus('all')}
                            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${filterStatus === 'all' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            All
                        </button>
                        <button 
                            onClick={() => setFilterStatus('checked')}
                            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${filterStatus === 'checked' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-green-400'}`}
                        >
                            Checked
                        </button>
                        <button 
                            onClick={() => setFilterStatus('missing')}
                            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${filterStatus === 'missing' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-red-400'}`}
                        >
                            Missing
                        </button>
                    </div>
                </div>

                {isLoadingUsers ? (
                    <div className="py-12 flex justify-center text-emerald-500">
                        <Loader2 className="animate-spin" size={32} />
                    </div>
                ) : (
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-[#16133a] z-10 shadow-sm">
                                <tr className="text-gray-400 border-b border-white/10 text-sm uppercase tracking-wider">
                                    <th className="pb-3 pl-2 pt-2">App User</th>
                                    <th className="pb-3 pt-2">Last.fm</th>
                                    <th className="pb-3 text-center pt-2">Status</th>
                                    <th className="pb-3 text-right pr-2 pt-2">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-8 text-gray-500 italic">
                                            {searchQuery ? 'No users match your search.' : 'No users found.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => {
                                        const checkedIn = isCheckedInToday(user.lastCheckInDate);
                                        return (
                                            <tr key={user.id} className="group hover:bg-white/5 transition-colors">
                                                <td className={`py-4 pl-2 font-bold ${checkedIn ? 'text-white' : 'text-red-400'}`}>
                                                    {user.appUsername}
                                                </td>
                                                <td className="py-4 text-gray-400 text-sm font-mono">{user.lastFmUsername}</td>
                                                <td className="py-4 flex justify-center">
                                                    {checkedIn ? (
                                                        <div className="flex items-center gap-1 bg-green-900/30 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/20">
                                                            <CheckCircle2 size={14} /> Checked In
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1 bg-red-900/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold border border-red-500/30">
                                                                <XCircle size={14} /> Missing
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-4 text-right pr-2">
                                                    <button 
                                                        onClick={() => setViewingUser(user)}
                                                        className="p-2 bg-white/5 hover:bg-blue-600/20 hover:text-blue-400 rounded-lg transition-colors border border-white/5"
                                                        title="View Full Profile"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
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
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="animate-fade-in space-y-6">
            
            {/* Admin Security Section */}
            <div className="glass p-6 rounded-2xl border border-red-500/20">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-400">
                    <ShieldCheck /> Admin Security
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                    Change the PIN used to access this Admin Panel.
                </p>
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Lock className="absolute left-3 top-3.5 text-gray-500" size={18} />
                        <input 
                            type="text" 
                            value={newAdminPin}
                            onChange={(e) => setNewAdminPin(e.target.value)}
                            placeholder="Enter New PIN"
                            maxLength={8}
                            className="w-full bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:border-red-500 focus:outline-none font-mono"
                        />
                    </div>
                    <button 
                        onClick={handleChangeAdminPin}
                        disabled={isSavingPin}
                        className="bg-red-600 hover:bg-red-500 text-white rounded-xl px-6 font-bold transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)] flex items-center justify-center gap-2"
                    >
                        {isSavingPin ? <Loader2 className="animate-spin" /> : <Key size={18} />}
                        Update PIN
                    </button>
                </div>
            </div>

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
                    Download a local copy of the entire database (Users + Weekly Schedule) or restore from a file.
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

      {/* VIEW USER PROFILE MODAL */}
      {viewingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
            <div className="glass max-w-lg w-full rounded-3xl relative border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header (Shrink-0) */}
                <div className="h-28 bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 relative shrink-0">
                    <button 
                        onClick={() => setViewingUser(null)}
                        className="absolute top-4 right-4 bg-black/30 p-2 rounded-full text-white hover:bg-black/50 transition-colors z-10"
                    >
                        <X size={20} />
                    </button>
                </div>
                
                {/* Avatar (Absolute on top) */}
                <div className="absolute top-16 left-1/2 transform -translate-x-1/2 w-24 h-24 rounded-full bg-[#16133a] border-4 border-[#0f0c29] flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)] z-30">
                    <div className="text-3xl font-bold text-white uppercase">{viewingUser.appUsername.charAt(0)}</div>
                </div>

                {/* Content (Flex-1 Scrollable) */}
                <div className="px-8 pb-8 flex-1 overflow-y-auto custom-scrollbar pt-14">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-white">{viewingUser.appUsername}</h2>
                        <div className="text-xs text-gray-500 font-mono mt-1">ID: {viewingUser.id}</div>
                        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                            {isCheckedInToday(viewingUser.lastCheckInDate) ? (
                                <span className="text-green-400 text-xs font-bold flex items-center gap-1"><CheckCircle2 size={12}/> Checked In Today</span>
                            ) : (
                                <span className="text-red-400 text-xs font-bold flex items-center gap-1"><XCircle size={12}/> Missing Today</span>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-6">
                        
                        {/* Activity Status (New) */}
                        <div className="glass p-4 rounded-xl border border-white/5">
                            <h4 className="text-gray-400 text-xs font-bold uppercase mb-3 flex items-center gap-2">
                                <CalendarCheck size={12} /> Activity Status
                            </h4>
                            <div className="grid gap-3">
                                <div>
                                    <label className="text-[10px] text-gray-500 block">Status Today</label>
                                    <div className="mt-1">
                                        {isCheckedInToday(viewingUser.lastCheckInDate) ? (
                                            <span className="text-green-400 text-sm font-bold flex items-center gap-2">
                                                <CheckCircle2 size={16} /> Checked In
                                            </span>
                                        ) : (
                                            <span className="text-red-400 text-sm font-bold flex items-center gap-2">
                                                <XCircle size={16} /> Missing
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-500 block">Last Check-in Date</label>
                                    <div className="text-sm font-medium text-white">
                                        {viewingUser.lastCheckInDate || 'Never'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Personal Music */}
                        <div className="glass p-4 rounded-xl border border-white/5">
                            <h4 className="text-gray-400 text-xs font-bold uppercase mb-3 flex items-center gap-2">
                                <Headphones size={12} /> Personal Music
                            </h4>
                            {viewingUser.personalPlaylistUrl ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded bg-blue-900/20 flex items-center justify-center text-blue-400 border border-blue-500/20">
                                            <Music size={18} />
                                        </div>
                                        <div className="overflow-hidden">
                                            <div className="text-sm font-bold text-white truncate">
                                                {viewingUser.personalTrack || 'Unknown Track'}
                                            </div>
                                            <div className="text-xs text-gray-400 truncate">
                                                {viewingUser.personalArtist || 'Unknown Artist'}
                                            </div>
                                        </div>
                                    </div>
                                    <a 
                                        href={viewingUser.personalPlaylistUrl}
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 break-all"
                                    >
                                        <LinkIcon size={10} /> {viewingUser.personalPlaylistUrl}
                                    </a>
                                </div>
                            ) : (
                                <div className="text-sm text-gray-500 italic">User hasn't set their music yet.</div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};