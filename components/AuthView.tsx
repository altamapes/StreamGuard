import React, { useState, useEffect } from 'react';
import { User as UserIcon, Lock, Music, ArrowRight, LogIn, AlertTriangle, Cloud, CloudOff, Globe, Key, Settings } from 'lucide-react';
import { User } from '../types';
import { storageService } from '../services/storage';

interface AuthViewProps {
  onLogin: (user: User) => void;
  onRegister: (newUser: User) => void;
  onOpenAdmin: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLogin, onRegister, onOpenAdmin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Cloud Status (Read Only)
  const [cloudStatus, setCloudStatus] = useState<'DISCONNECTED' | 'CONNECTED'>('DISCONNECTED');

  // Form States
  const [appUsername, setAppUsername] = useState('');
  const [password, setPassword] = useState('');
  const [lastFmUsername, setLastFmUsername] = useState('');
  const [lastFmApiKey, setLastFmApiKey] = useState('');
  
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const config = storageService.getCloudConfig();
    if (config && config.enabled) {
      setCloudStatus('CONNECTED');
    }
  }, []);

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
        const newUser: User = {
          id: Date.now().toString(),
          appUsername,
          password,
          lastFmUsername: lastFmUsername || '', 
          lastFmApiKey: lastFmApiKey || '',
          lastCheckInDate: null
        };
        await storageService.registerUser(newUser);
        onRegister(newUser);
      } else {
        const user = await storageService.loginUser(appUsername, password);
        onLogin(user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 animate-fade-in relative">
      <div className="mb-8 text-center">
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-neon-purple to-blue-600 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(176,38,255,0.4)] relative group">
          <Music size={40} className="text-white relative z-10" />
          {cloudStatus === 'CONNECTED' && (
            <div className="absolute top-0 right-0 bg-green-500 rounded-full p-1.5 border-2 border-[#0f0c29] z-20" title="Cloud Connected">
              <Cloud size={12} className="text-white" />
            </div>
          )}
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-blue-400 mb-2">
          StreamGuard
        </h1>
        <p className="text-purple-200 opacity-80 font-medium">
          {isRegistering ? 'Create your Community Profile' : 'Welcome Back, Streamer'}
        </p>
        
        {/* Status Indicator Only - No Click/Edit */}
        {cloudStatus === 'CONNECTED' ? (
          <p className="text-xs text-green-400 mt-2 flex items-center justify-center gap-1 opacity-70">
            <Globe size={12} /> Database Connected
          </p>
        ) : (
          <p className="text-xs text-gray-500 mt-2 flex items-center justify-center gap-1 opacity-70">
            <CloudOff size={12} /> Offline Mode
          </p>
        )}
      </div>

      <div className="glass p-8 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/10 relative">
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
                  placeholder="Login username"
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
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-400 text-sm text-center bg-red-900/20 p-3 rounded-xl border border-red-500/20 flex flex-col items-center justify-center gap-2 animate-fade-in">
              <div className="flex items-center gap-2 font-bold"><AlertTriangle size={18} /> Error</div>
              <div>{error}</div>
              
              {/* Emergency Fix Button */}
              {(error.includes('Cloud') || error.includes('Auth')) && (
                <button 
                  onClick={onOpenAdmin}
                  className="mt-2 flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-blue-300 hover:text-white transition-all border border-white/10"
                >
                  <Settings size={12} /> Fix Connection (Admin)
                </button>
              )}
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
            onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
            className="text-gray-400 hover:text-white text-sm transition-colors hover:underline"
          >
            {isRegistering ? 'Already have an account? Login' : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
};