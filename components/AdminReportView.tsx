import React, { useState } from 'react';
import { User, WeeklySchedule } from '../types';
import { Calendar, Search } from 'lucide-react';

interface AdminReportViewProps {
  users: User[];
  schedule: WeeklySchedule;
}

export const AdminReportView: React.FC<AdminReportViewProps> = ({ users, schedule }) => {
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('weekly');
  const [searchQuery, setSearchQuery] = useState('');

  // Weekly: Last 7 days
  // Monthly: Last 30 days
  const daysToLookBack = reportType === 'weekly' ? 7 : 30;

  const datesToCheck: { dateStr: string; dayIndex: number; hasTracks: boolean; isPast: boolean }[] = [];
  const today = new Date();
  today.setHours(0,0,0,0);

  for (let i = 0; i < daysToLookBack; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0,0,0,0);
    const dateStr = d.toLocaleDateString();
    const dayIndex = d.getDay();
    const dayConfig = schedule[dayIndex];
    const hasTracks = dayConfig && dayConfig.tracks && dayConfig.tracks.length > 0;
    
    // Check if it's past or today
    const isPast = d.getTime() < today.getTime();

    datesToCheck.push({ dateStr, dayIndex, hasTracks: !!hasTracks, isPast });
  }

  // How many target days are there in this period?
  // Only days with hasTracks count as target.
  const targetDaysCount = datesToCheck.filter(d => d.hasTracks).length;

  const getReportForUser = (user: User) => {
    let completedCount = 0;
    let debtCount = 0; // days that are past, had tracks, and user didn't check in
    
    datesToCheck.forEach(d => {
      const isCheckedIn = user.checkInHistory?.includes(d.dateStr) || user.lastCheckInDate === d.dateStr;
      
      if (d.hasTracks) {
        if (isCheckedIn) {
          completedCount++;
        } else if (d.isPast) { // Only count as debt if it's in the past
           debtCount++;
        } else if (d.dateStr === today.toLocaleDateString()) {
           // If it's today, it's missing if not checked in
           debtCount++;
        }
      }
    });

    return { completedCount, debtCount };
  };

  const filteredUsers = users.filter(user => 
      user.appUsername.toLowerCase().includes(searchQuery.toLowerCase()) || 
      user.lastFmUsername.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
       {/* Controls */}
       <div className="glass p-4 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 border border-white/10">
          <div className="flex bg-black/40 rounded-xl p-1 border border-white/10 w-full md:w-auto">
             <button 
                onClick={() => setReportType('weekly')}
                className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${reportType === 'weekly' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
             >
                Mingguan (7 Hari)
             </button>
             <button 
                onClick={() => setReportType('monthly')}
                className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${reportType === 'monthly' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
             >
                Bulanan (30 Hari)
             </button>
          </div>
          
          <div className="relative w-full md:w-64">
             <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
             <input 
                type="text" 
                placeholder="Cari user..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-purple-500 text-white placeholder-gray-600 text-sm"
             />
          </div>
       </div>

       {/* Report Table */}
       <div className="glass p-6 rounded-2xl shadow-lg shadow-purple-900/20 overflow-hidden">
          <div className="mb-4">
             <h3 className="text-lg font-bold text-white flex items-center gap-2">
                 <Calendar size={20} className="text-purple-400" /> 
                 Rekap Report {reportType === 'weekly' ? 'Mingguan' : 'Bulanan'}
             </h3>
             <p className="text-sm text-gray-400">Menampilkan rekapitulasi performa streaming dan check-in user selama {daysToLookBack} hari terakhir.</p>
          </div>
          
          <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                  <thead className="bg-[#16133a] border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
                      <tr>
                          <th className="p-4">User</th>
                          <th className="p-4 text-center">Total Target (Hari)</th>
                          <th className="p-4 text-center">Selesai Check-in</th>
                          <th className="p-4 text-center">Belum Absen / Hutang</th>
                          <th className="p-4 text-center">Pencapaian (%)</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                      {filteredUsers.length === 0 ? (
                           <tr>
                               <td colSpan={5} className="text-center py-8 text-gray-500 italic">Tidak ada user.</td>
                           </tr>
                      ) : (
                          filteredUsers.map(user => {
                              const { completedCount, debtCount } = getReportForUser(user);
                              const rate = targetDaysCount > 0 ? Math.round((completedCount / targetDaysCount) * 100) : 0;
                              return (
                                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                      <td className="p-4 font-bold text-white">
                                          {user.appUsername}
                                          <div className="text-xs text-gray-500 font-normal">{user.lastFmUsername}</div>
                                      </td>
                                      <td className="p-4 text-center text-gray-300 font-mono">{targetDaysCount}</td>
                                      <td className="p-4 text-center">
                                          <span className="text-green-400 font-bold flex items-center justify-center gap-1">
                                            {completedCount}
                                          </span>
                                      </td>
                                      <td className="p-4 text-center">
                                          {debtCount > 0 ? (
                                              <span className="text-red-400 font-bold bg-red-900/20 px-2 py-1 rounded-lg border border-red-500/20">
                                                  {debtCount}
                                              </span>
                                          ) : (
                                              <span className="text-gray-500">-</span>
                                          )}
                                      </td>
                                      <td className="p-4 text-center">
                                          <span className={`font-bold inline-block px-2 py-1 rounded-lg border content-center ${
                                            rate >= 100 ? 'bg-green-900/20 text-green-400 border-green-500/30' : 
                                            rate >= 50 ? 'bg-yellow-900/20 text-yellow-400 border-yellow-500/30' : 
                                            'bg-red-900/20 text-red-400 border-red-500/30'
                                          }`}>
                                              {rate}%
                                          </span>
                                      </td>
                                  </tr>
                              );
                          })
                      )}
                  </tbody>
              </table>
          </div>
       </div>
    </div>
  );
}
