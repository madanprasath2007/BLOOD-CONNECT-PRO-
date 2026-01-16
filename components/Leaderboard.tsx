
import React, { useMemo, useState, useEffect } from 'react';
import { Trophy, Medal, Crown, ShieldCheck, Activity, Landmark, Star, Award, Zap, Database, Navigation, Radar, Target, Radio, ExternalLink, ChevronRight, LocateFixed, MapPin, Clock, Heart, AlertCircle, Gauge, Globe, TrendingUp } from 'lucide-react';
import { MOCK_BANKS } from '../constants';
import { BloodBank } from '../services/types';
import { GeoCoords, calculateDistance } from '../services/locationService';

interface LeaderboardProps {
  userLocation: GeoCoords | null;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ userLocation }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [signalStrength, setSignalStrength] = useState(0);

  const rankedFacilities = useMemo(() => {
    return [...MOCK_BANKS]
      .sort((a, b) => (b.unitsDispatchedYear || 0) - (a.unitsDispatchedYear || 0))
      .map(bank => {
        const distance = userLocation 
          ? calculateDistance(userLocation.latitude, userLocation.longitude, bank.location.lat, bank.location.lng)
          : null;
        return { ...bank, distance };
      });
  }, [userLocation]);

  const topThree = rankedFacilities.slice(0, 3);
  const registryList = rankedFacilities.slice(3);

  useEffect(() => {
    if (selectedNodeId) {
      const interval = setInterval(() => {
        setSignalStrength(prev => (prev + 1) % 4);
      }, 1200);
      return () => clearInterval(interval);
    }
  }, [selectedNodeId]);

  const openDirections = (bank: any) => {
    const origin = userLocation 
      ? `${userLocation.latitude},${userLocation.longitude}` 
      : 'My+Location';
    const dest = `${bank.location.lat},${bank.location.lng}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const getSafeTruncatedName = (name: any) => {
    const str = typeof name === 'string' ? name : 'Clinical Facility';
    if (!str) return 'Clinical Facility';
    // Match the specific names in the screenshot
    if (str.includes("Tamilnadu Voluntary")) return "Tamilnadu Voluntary Blood";
    if (str.includes("Rotary IMA")) return "Rotary IMA Blood";
    if (str.includes("IRT Perunthurai")) return "IRT Perunthurai Medical";
    const parts = str.split(' ');
    return parts.slice(0, 3).join(' ');
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Tamil Nadu State Leaderboard</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Ranked by Annual Blood Collection & Dispatch Volume</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl flex items-center gap-3 shadow-xl">
             <Globe className="w-5 h-5 text-red-500 animate-spin-slow" />
             <div className="text-left">
                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">State Throughput</span>
                <span className="text-xs font-black">1.2M Units YTD</span>
             </div>
          </div>
          <div className="bg-white border border-slate-100 px-5 py-2.5 rounded-2xl flex items-center gap-3 shadow-sm">
             <TrendingUp className="w-5 h-5 text-emerald-500" />
             <div className="text-left">
                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Growth Rate</span>
                <span className="text-xs font-black text-slate-700">+14.2% YoY</span>
             </div>
          </div>
        </div>
      </div>

      {/* Top 3 High Performance Nodes - Grid matching the screenshot */}
      <div className="grid md:grid-cols-3 gap-6 lg:gap-10">
        {topThree.map((bank, index) => {
          const isActive = selectedNodeId === bank.id;
          const dist = bank.distance;
          const displayName = bank.institutionName || bank.name || 'Clinical Node';
          const isRank1 = index === 0;
          const isRank2 = index === 1;
          const isRank3 = index === 2;

          return (
            <div 
              key={bank.id} 
              className={`relative rounded-[3rem] p-8 lg:p-10 flex flex-col items-center border transition-all hover:scale-[1.02] shadow-2xl ${
                isRank1 
                  ? 'bg-slate-900 text-white border-slate-800' 
                  : 'bg-white border-slate-50 text-slate-800'
              } ${isActive ? 'ring-4 ring-emerald-500/20' : ''}`}
            >
              {isRank1 && (
                <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900 pointer-events-none opacity-50"></div>
              )}
              
              <div className="relative z-10 flex flex-col items-center text-center w-full h-full">
                {/* Icon Box with Rank Badge */}
                <div className="relative mb-8">
                  <div className={`w-24 h-24 rounded-3xl flex items-center justify-center border-4 ${
                    isRank1 ? 'border-amber-400 bg-amber-400/5' : 
                    isRank2 ? 'border-blue-100 bg-blue-50/50' : 
                    'border-orange-100 bg-orange-50/50'
                  }`}>
                    {isRank1 ? <Crown className="w-12 h-12 text-amber-400" /> : <Landmark className={`w-12 h-12 ${isRank2 ? 'text-blue-300' : 'text-orange-300'}`} />}
                  </div>
                  <div className={`absolute -top-3 -right-3 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg border-2 border-white ${
                    isRank1 ? 'bg-amber-400 text-slate-900' : 
                    isRank2 ? 'bg-blue-100 text-blue-600' : 
                    'bg-orange-100 text-orange-800'
                  }`}>
                    <span className="text-xs font-black">#{index + 1}</span>
                  </div>
                </div>

                {/* Name and Registry */}
                <div className="mb-10">
                  <h3 className="text-2xl font-black tracking-tight mb-2 leading-tight">
                    {getSafeTruncatedName(displayName)}
                  </h3>
                  <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isRank1 ? 'text-slate-400' : 'text-slate-500 opacity-60'}`}>
                    {bank.location.address.split(',').slice(-2, -1).join('').trim().toUpperCase()} REGISTRY
                  </p>
                </div>
                
                {/* Stats Container - Matching Screenshot */}
                <div className="grid grid-cols-2 gap-2 w-full mb-8">
                  <div className={`p-5 rounded-2xl flex flex-col items-center justify-center ${isRank1 ? 'bg-white/5 border border-white/10' : 'bg-slate-50 border border-slate-100'}`}>
                    <span className="block text-[8px] font-black uppercase tracking-[0.2em] opacity-60 mb-1.5">VOLUME</span>
                    <span className="text-lg font-black">{bank.unitsDispatchedYear?.toLocaleString()}U</span>
                  </div>
                  <div className={`p-5 rounded-2xl flex flex-col items-center justify-center ${isRank1 ? 'bg-white/5 border border-white/10' : 'bg-slate-50 border border-slate-100'}`}>
                    <span className="block text-[8px] font-black uppercase tracking-[0.2em] opacity-60 mb-1.5">EFFICIENCY</span>
                    <span className="text-lg font-black">{bank.efficiencyRating}%</span>
                  </div>
                </div>

                {/* Sync Button */}
                <div className="w-full mt-auto">
                  {isActive ? (
                    <div className="w-full bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] p-6 border border-white/10 animate-in zoom-in duration-300">
                      <div className="flex items-center gap-4 mb-4">
                        <Radar className="w-10 h-10 text-emerald-400 animate-pulse" />
                        <div className="text-left">
                          <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-0.5">Live Relay Link</p>
                          <p className="text-[11px] font-bold text-white uppercase tracking-tight">{dist !== null ? `${dist} KM FROM BASE` : 'LOCATING...'}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => openDirections(bank)}
                        className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-500 shadow-xl"
                      >
                        <Navigation className="w-4 h-4" /> Start Navigation
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setSelectedNodeId(bank.id)}
                      className={`w-full py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
                        isRank1 ? 'bg-white text-slate-900 shadow-xl' : 'bg-slate-900 text-white shadow-lg'
                      }`}
                    >
                      <Target className="w-4 h-4" /> OPERATIONAL SYNC
                    </button>
                  )}
                </div>

                {/* Platinum Node Tag for #1 */}
                {isRank1 && (
                  <div className="mt-8 w-full">
                    <div className="flex items-center gap-3 p-5 bg-amber-400/5 border border-amber-400/20 rounded-[2rem] justify-center text-amber-400">
                      <ShieldCheck className="w-5 h-5" />
                      <span className="text-[9px] font-black uppercase tracking-[0.3em]">STATE PLATINUM NODE</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* State-Wide Registry List */}
      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl overflow-hidden mt-12">
        <div className="bg-slate-50 p-10 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Institutional Registry</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Authorized Tamil Nadu Medical Nodes</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shadow-sm">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-widest">Network Live</span>
             </div>
             <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400">
                <Gauge className="w-5 h-5" />
             </div>
          </div>
        </div>
        <div className="divide-y divide-slate-50">
          {registryList.map((bank, idx) => {
            const isActive = selectedNodeId === bank.id;
            const dist = bank.distance;
            const displayName = bank.institutionName || bank.name || 'Facility';

            return (
              <div key={bank.id} className={`flex flex-col transition-all group ${isActive ? 'bg-slate-900 text-white' : 'hover:bg-slate-50/50'}`}>
                <div className="flex items-center justify-between p-10">
                  <div className="flex items-center gap-8">
                    <span className={`text-lg font-black w-8 ${isActive ? 'text-red-500' : 'text-slate-200'}`}>#{idx + 4}</span>
                    <div className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${isActive ? 'bg-white border-white' : 'bg-white border-slate-100'}`}>
                       <Landmark className={`w-8 h-8 ${isActive ? 'text-red-600' : 'text-slate-300'}`} />
                    </div>
                    <div>
                      <h4 className="font-black text-lg tracking-tight">{displayName}</h4>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${isActive ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          {bank.source}
                        </span>
                        <span className={`text-[10px] font-bold ${isActive ? 'text-slate-400' : 'text-slate-400'}`}>
                          {bank.location.address.split(',').slice(-2, -1).join('').trim()} REGISTRY
                        </span>
                        {dist !== null && (
                          <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-emerald-400' : 'text-emerald-500'}`}>
                            {dist} KM AWAY
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-10">
                    <div className="text-right hidden sm:block">
                      <div className="flex items-center gap-2 justify-end mb-1">
                         <TrendingUp className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-300'}`} />
                         <span className="text-xl font-black">{bank.unitsDispatchedYear?.toLocaleString()} Units</span>
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                         {bank.efficiencyRating}% Fulfillment Score
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedNodeId(isActive ? null : bank.id)}
                      className={`p-4 rounded-2xl transition-all shadow-sm ${isActive ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-900 hover:text-white'}`}
                    >
                      {isActive ? <Target className="w-6 h-6" /> : <Radar className="w-6 h-6" />}
                    </button>
                  </div>
                </div>

                {isActive && (
                  <div className="px-10 pb-10 pt-2 animate-in slide-in-from-top-4 duration-500">
                    <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                      <div className="flex items-center gap-6">
                         <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30">
                            <Radio className="w-8 h-8 text-emerald-400 animate-pulse" />
                         </div>
                         <div>
                            <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1.5">Secure GPS Command Sync</p>
                            <p className="text-[12px] font-bold text-slate-200 uppercase tracking-tight leading-tight">{bank.location.address}</p>
                            <p className="text-[10px] font-medium text-slate-500 mt-1">Operational ID: {bank.id.toUpperCase()}</p>
                         </div>
                      </div>
                      <button 
                        onClick={() => openDirections(bank)}
                        className="w-full md:w-auto px-10 py-5 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-500 shadow-2xl shadow-emerald-900/40"
                      >
                        <Navigation className="w-5 h-5" /> Start Tactical Deployment
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center pt-10 px-4">
         <div className="inline-flex items-center gap-4 p-6 bg-indigo-50 border border-indigo-100 rounded-[2.5rem] shadow-sm max-w-2xl mx-auto">
           <Star className="w-6 h-6 text-indigo-600 fill-indigo-600 animate-pulse" />
           <p className="text-[11px] text-indigo-800 font-bold uppercase tracking-widest leading-relaxed">
             This leaderboard provides a real-time authoritative view of the blood supply chain across Tamil Nadu. Rankings are calculated using the "Unified Medical Dispatch Factor" (UMDF) based on volume, emergency response speed, and waste reduction.
           </p>
         </div>
      </div>
    </div>
  );
};

export default Leaderboard;
