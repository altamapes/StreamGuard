import React, { useState, useEffect } from 'react';
import { Lock, Unlock, X } from 'lucide-react';
import { ViewMode, TargetTrack } from './types';
import { DEFAULT_TRACKS, STORAGE_KEY, ADMIN_PIN } from './constants';
import { AdminPanel } from './components/AdminPanel';
import { MemberView } from './components/MemberView';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.MEMBER);
  const [targetTracks, setTargetTracks] = useState<TargetTrack[]>([]);
  
  // Pin Modal State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Initialize from LocalStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setTargetTracks(JSON.parse(stored));
      } catch (e) {
        setTargetTracks(DEFAULT_TRACKS);
      }
    } else {
      setTargetTracks(DEFAULT_TRACKS);
    }
  }, []);

  // Save to LocalStorage whenever tracks change
  const handleSaveTracks = (newTracks: TargetTrack[]) => {
    setTargetTracks(newTracks);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTracks));
    alert('Playlist updated successfully!');
  };

  // Handle Admin Access
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === ADMIN_PIN) {
      setViewMode(ViewMode.ADMIN);
      setIsPinModalOpen(false);
      setPinInput('');
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden flex flex-col">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-900/30 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/30 blur-[120px] pointer-events-none" />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-start pt-10 px-4 pb-20 z-10">
        {viewMode === ViewMode.ADMIN ? (
          <AdminPanel 
            tracks={targetTracks} 
            onSave={handleSaveTracks} 
            onExit={() => setViewMode(ViewMode.MEMBER)} 
          />
        ) : (
          <MemberView tracks={targetTracks} />
        )}
      </main>

      {/* Admin Trigger (Bottom Left) */}
      {viewMode === ViewMode.MEMBER && (
        <button
          onClick={() => setIsPinModalOpen(true)}
          className="fixed bottom-6 left-6 p-3 rounded-full bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white transition-all z-50 group"
          aria-label="Admin Access"
        >
          <Lock size={16} className="group-hover:opacity-100 opacity-50" />
        </button>
      )}

      {/* PIN Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass w-full max-w-sm p-6 rounded-2xl relative animate-bounce-in">
            <button 
              onClick={() => setIsPinModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
            
            <h3 className="text-xl font-bold mb-4 text-center">Admin Access</h3>
            <p className="text-gray-400 text-sm text-center mb-6">Enter PIN to configure playlist.</p>
            
            <form onSubmit={handlePinSubmit} className="flex flex-col gap-4">
              <input 
                type="password" 
                maxLength={4}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                className="bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-purple-500 transition-colors"
                autoFocus
              />
              
              {pinError && (
                <p className="text-red-500 text-xs text-center">Incorrect PIN. Try '1234'.</p>
              )}

              <button 
                type="submit"
                className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl py-3 font-bold mt-2 shadow-[0_0_10px_rgba(168,85,247,0.4)] transition-all flex justify-center items-center gap-2"
              >
                <Unlock size={18} />
                Unlock
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;