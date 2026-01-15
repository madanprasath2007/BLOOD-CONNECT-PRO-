
import React, { useMemo } from 'react';
import { Trophy, Medal, Crown, ShieldCheck, Activity, Landmark, Star, Award, Zap, Database } from 'lucide-react';
import { MOCK_BANKS } from '../constants';
import { BloodBank } from '../services/types';

const Leaderboard: React.FC = () => {
  const rankedBanks = useMemo(() => {
    return [...MOCK_BANKS]
      .sort((a, b) => (b.unitsDispatchedYear || 0) - (a.unitsDispatchedYear || 0));
  }, []);

  const topThree = rankedBanks.slice(0, 3);
  const others = rankedBanks.slice(3);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Top Facilities</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Network Performance Leaderboard (Throughput / Emergency Speed)</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white border border-slate-100 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-sm">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-slate-700">4.2m Total Response</span>
          </div>
          <div className="bg-white border border-slate-100 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-sm">
            <Database className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-700">96.4% Accuracy</span>
          </div>
        </div>
      </div>

      {/* The Podium - Portrait Cards */}
      <div className="grid md:grid-cols-3 gap-8 px-2">
        {topThree.map((bank, index) => (
          <div 
            key={bank.id} 
            className={`relative rounded-[3rem] p-10 min-h-[520px] overflow-hidden border-2 transition-all hover:scale-[1.02] flex flex-col items-center justify-between shadow-2xl ${
              index === 0 
                ? 'bg-slate-900 text-white border-slate-800 shadow-slate-900/40' 
                : 'bg-white border-slate-50 shadow-slate-200/50 text-slate-800'
            }`}
          >
            {/* Background Aesthetic for Rank 1 */}
            {index === 0 && (
              <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900 pointer-events-none opacity-50"></div>
            )}
            
            <div className="relative z-10 flex flex-col items-center text-center w-full">
              {/* Icon & Rank Indicator */}
              <div className="relative mb-8">
                <div className={`w-24 h-24 rounded-[2rem] overflow-hidden border-4 flex items-center justify-center transition-transform group-hover:scale-110 ${
                  index === 0 ? 'border-amber-400 bg-amber-400/10' : 
                  index === 1 ? 'border-slate-200 bg-slate-50' : 
                  'border-orange-200 bg-orange-50'
                }`}>
                  <Landmark className={`w-12 h-12 ${
                    index === 0 ? 'text-amber-400' : 
                    index === 1 ? 'text-slate-400' : 
                    'text-orange-400'
                  }`} />
                </div>
                <div className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white ${
                  index === 0 ? 'bg-amber-400 text-slate-900' : 
                  index === 1 ? 'bg-slate-200 text-slate-600' : 
                  'bg-orange-100 text-orange-800'
                }`}>
                  {index === 0 ? <Trophy className="w-5 h-5" /> : <span className="text-xs font-black">{index + 1}</span>}
                </div>
              </div>

              {/* Facility Identity */}
              <h3 className="text-2xl font-black tracking-tight mb-4 leading-tight">
                {bank.name.split(' ').slice(0, 2).join(' ')}
              </h3>
              
              <div className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] mb-12 shadow-sm ${
                index === 0 ? 'bg-white/10 text-white border border-white/10' : 'bg-slate-50 text-slate-500 border border-slate-100'
              }`}>
                {bank.efficiencyRating}% EFFICIENCY
              </div>

              {/* Stats Block - Arranged properly in Portrait Card */}
              <div className={`flex flex-col gap-6 w-full pt-8 border-t ${
                index === 0 ? 'border-white/10' : 'border-slate-100'
              }`}>
                <div className="flex flex-col items-center">
                  <span className={`text-[9px] font-black uppercase tracking-[0.3em] mb-2 opacity-50`}>Dispatched</span>
                  <span className={`text-3xl font-black ${index === 0 ? 'text-white' : 'text-slate-900'}`}>{bank.unitsDispatchedYear}U</span>
                </div>
                
                <div className="flex flex-col items-center">
                  <span className={`text-[9px] font-black uppercase tracking-[0.3em] mb-2 opacity-50`}>Critical</span>
                  <span className="text-3xl font-black text-red-600">{bank.emergencyResponseCount}</span>
                </div>
              </div>
            </div>

            {/* Bottom Badge */}
            {index === 0 && (
              <div className="relative z-10 mt-10 w-full">
                <div className="flex items-center gap-2 text-[10px] font-black text-amber-400 uppercase tracking-[0.3em] bg-amber-400/10 px-6 py-4 rounded-[1.5rem] justify-center border border-amber-400/20">
                  <ShieldCheck className="w-4 h-4" />
                  PLATINUM NODE
                </div>
              </div>
            )}
            {index !== 0 && (
              <div className="relative z-10 mt-10 w-full">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] bg-slate-50 px-6 py-4 rounded-[1.5rem] justify-center border border-slate-100">
                  SECURE SYNC
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Other Rankings List */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden mt-12">
        <div className="bg-slate-50 p-8 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Network Registry</h3>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Integration</span>
          </div>
        </div>
        <div className="divide-y divide-slate-50">
          {others.map((bank, idx) => (
            <div key={bank.id} className="flex items-center justify-between p-8 hover:bg-slate-50/50 transition-colors group">
              <div className="flex items-center gap-6">
                <span className="text-sm font-black text-slate-200 group-hover:text-red-600 transition-colors w-6">#{idx + 4}</span>
                <div className="w-14 h-14 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                   <Landmark className="w-7 h-7 text-slate-300 group-hover:text-red-500 transition-colors" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-base">{bank.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg uppercase tracking-tighter">{bank.source} SYNC</span>
                    <span className="text-[10px] font-bold text-slate-400">{bank.efficiencyRating}% Avg. Efficiency</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end mb-1">
                   <Activity className="w-4 h-4 text-slate-300" />
                   <span className="text-lg font-black text-slate-800">{bank.unitsDispatchedYear} Units</span>
                </div>
                <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{bank.emergencyResponseCount} Emergencies Cleared</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center pt-8">
         <div className="inline-flex items-center gap-3 p-5 bg-indigo-50 border border-indigo-100 rounded-[2rem] shadow-sm">
           <Star className="w-5 h-5 text-indigo-600 fill-indigo-600" />
           <p className="text-[11px] text-indigo-800 font-bold uppercase tracking-widest">
             Metrics are based on ISO 9001:2015 blood bank compliance standards and emergency response latencies.
           </p>
         </div>
      </div>
    </div>
  );
};

export default Leaderboard;
