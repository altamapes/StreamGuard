import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Save, ArrowLeft, Plus, Settings, Database, Cloud, CloudOff, Download, Upload, ListMusic } from 'lucide-react';
import { TargetTrack, CloudConfig } from '../types';
import { storageService } from '../services/storage';

interface AdminPanelProps {
  tracks: TargetTrack[];
  onSave: (tracks: TargetTrack[]) => void;
  onExit: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ tracks, onSave, onExit }) => {
  const [activeTab, setActiveTab] = useState<'playlist' | 'settings'>('playlist');
  
  // Playlist State
  const [localTracks, setLocalTracks] = useState<TargetTrack[]>(tracks);
  const [newArtist, setNewArtist] = useState('');
  const [newTitle, setNewTitle] = useState('');

  // Settings State
  const [cloudConfig, setCloudConfig] = useState<CloudConfig>({ enabled: false, binId: '', apiKey: '' });
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load existing cloud config when panel opens
    const config = storageService.getCloudConfig();
    if (config) {
      setCloudConfig(config);
    }
  }, []);

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

  // --- SETTINGS LOGIC ---
  const handleSaveCloudConfig = () => {
    if (cloudConfig.binId && cloudConfig.apiKey) {
      const newConfig = { ...cloudConfig, enabled: true };
      storageService.saveCloudConfig(newConfig);
      setCloudConfig(newConfig);
      setSettingsMsg('Cloud Connected! Please restart app or reload page.');
    }
  };

  const handleDisconnectCloud = () => {
    storageService.disconnectCloud();
    setCloudConfig({ enabled: false, binId: '', apiKey: '' });
    setSettingsMsg('Cloud Disconnected. Using Local Storage.');
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

  return (
    <div className="w-full max-w-3xl mx-auto p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          Admin Dashboard
        </h2>
        <button 
          onClick={onExit}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-sm font-medium"
        >
          <ArrowLeft size={16} />
          Exit Admin
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button 
            onClick={() => setActiveTab('playlist')}
            className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'playlist' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
        >
            <ListMusic size={18} /> Playlist Manager
        </button>
        <button 
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
        >
            <Settings size={18} /> System Settings
        </button>
      </div>

      {activeTab === 'playlist' && (
        <>
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

      {activeTab === 'settings' && (
        <div className="animate-fade-in space-y-6">
            
            {/* Cloud Config Section */}
            <div className="glass p-6 rounded-2xl border border-blue-500/20">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-400">
                    <Cloud /> Database Connection
                </h3>
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
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none"
                            placeholder="e.g. 65d4f..."
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 block mb-1">Master Key (X-Master-Key)</label>
                        <input 
                            type="password" 
                            value={cloudConfig.apiKey} 
                            onChange={(e) => setCloudConfig({...cloudConfig, apiKey: e.target.value})}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none"
                            placeholder="e.g. $2a$10$..."
                        />
                    </div>
                    
                    <div className="flex gap-4 pt-2">
                        <button 
                            onClick={handleSaveCloudConfig}
                            className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-white transition-colors"
                        >
                            {cloudConfig.enabled ? 'Update Connection' : 'Connect Cloud'}
                        </button>
                        
                        {cloudConfig.enabled && (
                            <button 
                                onClick={handleDisconnectCloud}
                                className="px-6 py-3 bg-red-900/50 hover:bg-red-900 text-red-300 rounded-xl font-bold transition-colors flex items-center gap-2"
                            >
                                <CloudOff size={18} /> Disconnect
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
                <div className="p-4 bg-white/10 rounded-xl text-center text-white font-medium border border-white/20 animate-pulse">
                    {settingsMsg}
                </div>
            )}
        </div>
      )}
    </div>
  );
};