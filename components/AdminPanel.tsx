import React, { useState } from 'react';
import { Trash2, Save, ArrowLeft, Plus } from 'lucide-react';
import { TargetTrack } from '../types';

interface AdminPanelProps {
  tracks: TargetTrack[];
  onSave: (tracks: TargetTrack[]) => void;
  onExit: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ tracks, onSave, onExit }) => {
  const [localTracks, setLocalTracks] = useState<TargetTrack[]>(tracks);
  const [newArtist, setNewArtist] = useState('');
  const [newTitle, setNewTitle] = useState('');

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

  const handleSave = () => {
    onSave(localTracks);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          Admin Control
        </h2>
        <button 
          onClick={onExit}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-sm font-medium"
        >
          <ArrowLeft size={16} />
          Back to Member
        </button>
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
            onClick={handleSave}
            className="flex items-center gap-2 bg-green-500/80 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-[0_0_15px_rgba(74,222,128,0.4)]"
          >
            <Save size={18} />
            Save Playlist
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
    </div>
  );
};