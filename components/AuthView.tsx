import React, { useState } from 'react';
import { User as UserIcon, Lock, Key, Music, ArrowRight, LogIn } from 'lucide-react';
import { User } from '../types';

interface AuthViewProps {
  onLogin: (user: User) => void;
  usersDb: User[];
  onRegister: (newUser: User) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLogin, usersDb, onRegister }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Form States
  const [appUsername, setAppUsername] = useState('');
  const [password, setPassword] = useState('');
  const [lastFmUsername, setLastFmUsername] = useState('');
  const [lastFmApiKey, setLastFmApiKey] = useState('');
  
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!appUsername || !password) {
      setError('Username and Password are required.');
      return;
    }

    if (isRegistering) {
      // REGISTER LOGIC
      if (usersDb.some(u => u.appUsername.toLowerCase() === appUsername.toLowerCase())) {
        setError('Username already taken.');
        return;
      }
      
      const newUser: User = {
        id: Date.now().toString(),
        appUsername,
        password,
        lastFmUsername: lastFmUsername || '', // Allow empty for mock testing if needed
        lastFmApiKey: lastFmApiKey || '',
        lastCheckInDate: null
      };

      onRegister(newUser);
    } else {
      // LOGIN LOGIC
      const foundUser = usersDb.find(
        u => u.appUsername.toLowerCase() === appUsername.toLowerCase() && u.password === password
      );

      if (foundUser) {
        onLogin(foundUser);
      } else {
        setError('Invalid username or password.');
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 animate-fade-in">
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

      <div className="glass p-8 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/10">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* App Login Credentials */}
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

          {/* Extended Fields for Registration */}
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
                <p className="text-[10px] text-gray-500 mt-1 pl-1">
                  We save this securely in your browser so you don't type it again.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded-lg border border-red-500/20">
              {error}
            </div>
          )}

          <button 
            type="submit"
            className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all mt-4 bg-gradient-to-r from-neon-purple to-pink-600 text-white shadow-[0_0_20px_rgba(176,38,255,0.4)] hover:scale-[1.02]"
          >
            {isRegistering ? (
              <>Create Account <ArrowRight size={20} /></>
            ) : (
              <>Login to Stream <LogIn size={20} /></>
            )}
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
    </div>
  );
};