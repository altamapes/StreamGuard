import React, { useState, useRef } from 'react';
import { User as UserIcon, Lock, Key, Music, ArrowRight, LogIn, Download, Upload, Settings, AlertTriangle, Check, X } from 'lucide-react';
import { User } from '../types';
import { storageService } from '../services/storage';

interface AuthViewProps {
  onLogin: (user: User) => void;
  onRegister: (newUser: User) => void;
  // usersDb prop removed as the service handles it internally now
}

export const AuthView: React.FC<AuthViewProps> = ({ onLogin, onRegister }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form States
  const [appUsername, setAppUsername] = useState('');
  const [password, setPassword] = useState('');
  const [lastFmUsername, setLastFmUsername] = useState('');
  const [lastFmApiKey, setLastFmApiKey] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!appUsername || !password) {
      setError('Username and Password are required.');
      setIsLoading(false);
      return;
    }

    try {
      if (isRegistering) {
        // REGISTER LOGIC via Service
        const newUser: User = {
          id: Date.now().toString(),
          appUsername,
          password,
          lastFmUsername: lastFmUsername || '', 
          lastFmApiKey: lastFmApiKey || '',
          lastCheckInDate: null
        };

        // Service throws error if username taken
        await storageService.registerUser(newUser);
        
        // Pass up to parent to set session
        onRegister(newUser);
      } else {
        // LOGIN LOGIC via Service
        const user = await storageService.loginUser(appUsername, password);
        onLogin(user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  // --- DATA MANAGEMENT LOGIC ---

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
      a.download = `streamguard_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSuccessMsg('Backup downloaded successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError('Failed to generate backup.');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);

        if (!json.users && !json.playlist) {
            throw new Error('Invalid backup file format');
        }

        if (window.confirm('This will overwrite current data. Are you sure?')) {
            storageService.importData(
              json.users ? JSON.stringify(json.users) : null,
              json.playlist ? JSON.stringify(json.playlist) : null
            );
            
            alert('Data restored! The page will now reload.');
            window.location.reload();
        }
      } catch (err) {
        setError('Invalid backup file. Could not restore.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 animate-fade-in relative">
      <div className="mb-8 text-center">
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-neon-purple to-blue-600 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(176,38,255,0.4)]">
          <Music size={40} className="text-white" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-blue-400 mb-2">
          StreamGuard
        </h1>
        <p className="text-purple-200 opacity-80 font-medium">
          {isRegistering ? 'Create your Community Profile' : 'Welcome Back, Streamer'}
        </p>
      </div>

      <div className="glass p-8 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/10 relative">
        
        {/* Settings/Data Button */}
        <button 
            onClick={() => setShowDataModal(true)}
            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors p-2"
            title="Data Management"
        >
            <Settings size={20} />
        </button>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Username</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3.5 text-gray-500" size={18} />
                <input 
                  type="text" 
                  value={appUsername}
                  onChange={(e) => setAppUsername(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-neon-purple text-white placeholder-gray-600 transition-colors"
                  placeholder="Create a login username"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-gray-500" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-neon-purple text-white placeholder-gray-600 transition-colors"
                  placeholder="********"
                />
              </div>
            </div>
          </div>

          {isRegistering && (
            <div className="pt-4 border-t border-white/10 space-y-4 animate-fade-in">
              <p className="text-xs text-neon-green font-mono text-center mb-2">LAST.FM CONFIGURATION</p>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Last.fm Username</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3.5 text-gray-500" size={18} />
                  <input 
                    type="text" 
                    value={lastFmUsername}
                    onChange={(e) => setLastFmUsername(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-neon-green text-white placeholder-gray-600 transition-colors"
                    placeholder="Your Last.fm ID"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Last.fm API Key</label>
                <div className="relative">
                  <Key className="absolute left-3 top-3.5 text-gray-500" size={18} />
                  <input 
                    type="password" 
                    value={lastFmApiKey}
                    onChange={(e) => setLastFmApiKey(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-neon-green text-white placeholder-gray-600 transition-colors"
                    placeholder="32-character API Key"
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded-lg border border-red-500/20 flex items-center justify-center gap-2">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all mt-4 text-white shadow-[0_0_20px_rgba(176,38,255,0.4)] ${
              isLoading ? 'bg-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-neon-purple to-pink-600 hover:scale-[1.02]'
            }`}
          >
            {isLoading ? 'Processing...' : (isRegistering ? <><ArrowRight size={20} /> Create Account</> : <><LogIn size={20} /> Login</>)}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError(null);
            }}
            className="text-gray-400 hover:text-white text-sm transition-colors hover:underline"
          >
            {isRegistering ? 'Already have an account? Login' : "Don't have an account? Register"}
          </button>
        </div>
      </div>

      {showDataModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
             <div className="glass max-w-sm w-full p-6 rounded-3xl relative border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <button 
                    onClick={() => {
                        setShowDataModal(false);
                        setSuccessMsg(null);
                        setError(null);
                    }}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                    <X size={20} />
                </button>

                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Settings className="text-neon-purple" /> Data Backup
                </h3>
                <p className="text-sm text-gray-400 mb-6">
                    Because this app runs in your browser without a server, use this to move your data to another device.
                </p>

                <div className="space-y-3">
                    <button 
                        onClick={handleExportData}
                        className="w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                        <Download size={18} className="text-neon-green" /> Backup My Data
                    </button>

                    <div className="relative">
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".json"
                            className="hidden"
                        />
                        <button 
                            onClick={handleImportClick}
                            className="w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl flex items-center justify-center gap-2 transition-all"
                        >
                            <Upload size={18} className="text-blue-400" /> Restore Backup
                        </button>
                    </div>
                </div>

                {successMsg && (
                    <div className="mt-4 text-green-400 text-sm text-center bg-green-900/20 p-2 rounded-lg flex items-center justify-center gap-2">
                        <Check size={16} /> {successMsg}
                    </div>
                )}
             </div>
        </div>
      )}
    </div>
  );
};