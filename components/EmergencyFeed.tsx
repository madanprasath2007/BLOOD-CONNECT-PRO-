
import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  Droplets, 
  Phone, 
  MapPin, 
  Search, 
  PlusCircle, 
  Activity, 
  Navigation, 
  LocateFixed, 
  Globe, 
  Wifi, 
  Zap, 
  ChevronRight,
  ShieldAlert,
  Map as MapIcon,
  LayoutList,
  CheckCircle2,
  Database,
  ExternalLink,
  Loader2,
  Stethoscope,
  Info,
  Radar,
  Landmark,
  RefreshCw,
  Building2,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Volume2,
  PackageCheck
} from 'lucide-react';
import { EmergencyRequest, BloodType, AuthenticatedUser } from '../services/types';
import { GeoCoords, calculateDistance } from '../services/locationService';
import { fetchLiveAvailability, ERaktKoshStatus } from '../services/eraktkoshService';
import { speakEmergencyAlert } from '../services/geminiService';
import { backendService } from '../services/backendService';
import InteractiveMap from './InteractiveMap';

interface FeedProps {
  requests: EmergencyRequest[];
  onMatch: (req: EmergencyRequest) => void;
  dengueMode: boolean;
  userLocation: GeoCoords | null;
  user?: AuthenticatedUser | null;
}

type FeedScope = 'local' | 'nationwide';
type ViewMode = 'list' | 'map';

const EmergencyFeed: React.FC<FeedProps> = ({ requests, onMatch, dengueMode, userLocation, user }) => {
  const [filter, setFilter] = useState('');
  const [scope, setScope] = useState<FeedScope>('nationwide');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [checkingInventory, setCheckingInventory] = useState<string | null>(null);
  const [inventoryStatus, setInventoryStatus] = useState<Record<string, ERaktKoshStatus>>({});
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const [fulfillingId, setFulfillingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return requests.filter(r => {
      const matchesDengue = dengueMode ? r.isPlateletRequest : true;
      const matchesSearch = 
        r.patientName.toLowerCase().includes(filter.toLowerCase()) || 
        r.hospital.toLowerCase().includes(filter.toLowerCase()) ||
        r.bloodType.includes(filter.toUpperCase());
      
      let matchesLocation = true;
      if (scope === 'local' && userLocation && r.coordinates) {
        const distance = calculateDistance(userLocation.latitude, userLocation.longitude, r.coordinates.lat, r.coordinates.lng);
        matchesLocation = distance <= 30;
      }
      
      return matchesDengue && matchesSearch && matchesLocation;
    });
  }, [requests, filter, scope, userLocation, dengueMode]);

  const handleSpeech = async (req: EmergencyRequest) => {
    if (isSpeaking) return;
    setIsSpeaking(req.id);
    const text = `${req.urgency} request for ${req.bloodType} blood at ${req.hospital}. Patient ${req.patientName} requires ${req.unitsNeeded} units immediately.`;
    const audioData = await speakEmergencyAlert(text);
    
    if (audioData) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      const dataInt16 = new Int16Array(audioData.buffer);
      const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
      const channel = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) {
        channel[i] = dataInt16[i] / 32768.0;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => setIsSpeaking(null);
      source.start();
    } else {
      setIsSpeaking(null);
    }
  };

  const handleInventoryCheck = async (requestId: string, hospitalName: string) => {
    setCheckingInventory(requestId);
    try {
      const status = await fetchLiveAvailability(hospitalName);
      setInventoryStatus(prev => ({ ...prev, [requestId]: status }));
    } catch (error) {
      console.error("e-RaktKosh Sync Failed", error);
    } finally {
      setCheckingInventory(null);
    }
  };

  const handleMarkFulfilled = async (req: EmergencyRequest) => {
    setFulfillingId(req.id);
    setTimeout(() => {
      backendService.updateEmergencyRequestStatus(req.id, 'Fulfilled');
      setFulfillingId(null);
    }, 800);
  };

  const nationalStats = useMemo(() => ({
    totalUnits: filtered.reduce((acc, curr) => acc + curr.unitsNeeded, 0),
    criticalCount: filtered.filter(r => r.urgency === 'Critical' && r.status !== 'Fulfilled').length,
    activeNodes: filtered.map(r => r.hospital).filter((v, i, a) => a.indexOf(v) === i).length
  }), [filtered]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      {/* Strategic Command Header */}
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl border border-slate-800">
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-red-600 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-red-900/40 border-2 border-red-500/50">
                <Globe className="w-10 h-10 animate-spin-slow text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tight uppercase leading-tight">National Operations</h2>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Medical Cloud Relay: Online</p>
                </div>
              </div>
            </div>
            
            <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
              <button 
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}
              >
                <LayoutList className="w-4 h-4" /> Operations Registry
              </button>
              <button 
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'map' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}
              >
                <MapIcon className="w-4 h-4" /> Strategic Map
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-sm">
              <span className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Total Demand</span>
              <span className="text-3xl font-black text-white flex items-baseline gap-1">
                {nationalStats.totalUnits} <span className="text-xs font-bold text-slate-400">UNITS</span>
              </span>
            </div>
            <div className="bg-red-600/10 border border-red-500/30 p-5 rounded-3xl backdrop-blur-sm">
              <span className="block text-[9px] font-black text-red-400 uppercase tracking-[0.3em] mb-2">Critical SOS</span>
              <span className="text-3xl font-black text-red-500 flex items-baseline gap-1">
                {nationalStats.criticalCount} <span className="text-xs font-bold text-red-400">CASES</span>
              </span>
            </div>
            <div className="bg-blue-600/10 border border-blue-500/30 p-5 rounded-3xl backdrop-blur-sm">
              <span className="block text-[9px] font-black text-blue-400 uppercase tracking-[0.3em] mb-2">Active Nodes</span>
              <span className="text-3xl font-black text-blue-400 flex items-baseline gap-1">
                {nationalStats.activeNodes} <span className="text-xs font-bold text-blue-400">HOSPITALS</span>
              </span>
            </div>
            <div className="bg-emerald-600/10 border border-emerald-500/30 p-5 rounded-3xl backdrop-blur-sm">
              <span className="block text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-2">Network Health</span>
              <span className="text-3xl font-black text-emerald-500">OPTIMAL</span>
            </div>
          </div>
        </div>
      </div>

      {/* View Logic */}
      {viewMode === 'map' && userLocation ? (
        <div className="animate-in zoom-in duration-500">
           <div className="relative h-[650px] rounded-[3.5rem] overflow-hidden border-4 border-white shadow-2xl">
              <div className="absolute top-8 left-8 z-20 flex flex-col gap-3">
                 <div className="bg-slate-900/90 backdrop-blur-xl text-white px-6 py-4 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg">
                       <Radar className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Live Deployment Map</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase">Fulfillment Node Clusters Displayed</p>
                    </div>
                 </div>
              </div>
              <InteractiveMap 
                userLat={userLocation.latitude} 
                userLng={userLocation.longitude} 
                banks={filtered.map(r => ({ ...r, lat: r.coordinates?.lat, lng: r.coordinates?.lng, name: r.hospital }))}
                isTracking={false}
              />
           </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Registry Control Panel */}
          <div className="flex flex-col lg:flex-row gap-5">
            <div className="relative flex-1">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text"
                placeholder="Filter national registry by hospital, region, or clinical group..."
                className="w-full pl-14 pr-6 py-5 rounded-[2rem] border border-slate-200 bg-white shadow-xl font-bold text-sm focus:ring-4 focus:ring-red-500/10 transition-all"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            <div className="flex bg-white p-2 rounded-[2rem] shadow-xl border border-slate-100">
              <button 
                onClick={() => setScope('local')}
                className={`flex items-center gap-2.5 px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${scope === 'local' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <LocateFixed className="w-4 h-4" /> 30KM Local
              </button>
              <button 
                onClick={() => setScope('nationwide')}
                className={`flex items-center gap-2.5 px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${scope === 'nationwide' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Globe className="w-4 h-4" /> All India Relay
              </button>
            </div>
          </div>

          {/* Emergency Cards */}
          <div className="grid gap-8">
            {filtered.length === 0 ? (
              <div className="text-center py-32 bg-white rounded-[3.5rem] border-4 border-dashed border-slate-100 flex flex-col items-center">
                <ShieldAlert className="w-20 h-20 text-slate-100 mb-6" />
                <h4 className="text-slate-400 font-black uppercase tracking-widest">No Active SOS Signals</h4>
                <p className="text-slate-300 text-xs font-bold mt-2 max-w-xs">Registry is synchronized with national nodes.</p>
              </div>
            ) : (
              filtered.map(req => {
                const distance = (userLocation && req.coordinates)
                  ? calculateDistance(userLocation.latitude, userLocation.longitude, req.coordinates.lat, req.coordinates.lng)
                  : null;
                
                const isCritical = req.urgency === 'Critical';
                const status = inventoryStatus[req.id];
                const isFulfilled = req.status === 'Fulfilled';

                // Bulletproof string splitting for Node IDs
                const getSafeRegistryId = (id: any) => {
                  const str = typeof id === 'string' ? id : 'IND-000';
                  const parts = str.split('-');
                  return parts.length > 1 ? parts[1].toUpperCase() : str.toUpperCase();
                };

                return (
                  <div 
                    key={req.id} 
                    className={`group relative bg-white rounded-[3.5rem] border transition-all hover:shadow-3xl overflow-hidden ${isFulfilled ? 'border-emerald-100 bg-emerald-50/5 grayscale-[0.5]' : isCritical ? 'border-red-200 ring-4 ring-red-50' : 'border-slate-100 shadow-xl'}`}
                  >
                    <div className="absolute top-0 right-0 flex gap-1 z-10">
                      <button 
                        onClick={() => handleSpeech(req)}
                        className={`px-4 py-3 rounded-bl-[1.5rem] transition-all flex items-center gap-2 ${isSpeaking === req.id ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-100 text-slate-500 hover:bg-red-600 hover:text-white'}`}
                      >
                        <Volume2 className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Audio Briefing</span>
                      </button>
                      <div className={`px-10 py-3 rounded-bl-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-lg ${isFulfilled ? 'bg-emerald-600 text-white' : isCritical ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-900 text-white'}`}>
                        {isFulfilled ? 'FULFILLED' : `${req.urgency} Case Relay`}
                      </div>
                    </div>

                    <div className="p-10">
                      <div className="flex flex-col xl:flex-row justify-between gap-10 mb-10">
                        <div className="flex gap-8">
                          <div className={`w-28 h-28 rounded-[2.5rem] flex flex-col items-center justify-center font-black text-4xl border-4 transition-transform group-hover:rotate-3 ${isFulfilled ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : req.isPlateletRequest ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                            <span>{req.bloodType}</span>
                            <span className="text-[10px] font-black opacity-50 tracking-[0.2em] mt-1">{req.isPlateletRequest ? 'PLT' : 'WHOLE'}</span>
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="font-black text-slate-800 text-3xl tracking-tight leading-tight mb-4 flex items-center gap-3">
                              {req.patientName}
                              <ShieldCheck className={`w-6 h-6 ${isFulfilled ? 'text-emerald-500' : 'text-slate-300'}`} />
                            </h3>
                            <div className="flex flex-wrap items-center gap-6">
                              <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                                <Building2 className="w-4 h-4 text-red-500" />
                                <span className="text-xs font-black text-slate-800 uppercase tracking-wide">{req.hospital}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                <MapPin className="w-4 h-4" />
                                <span>Registry Node: {getSafeRegistryId(req.id)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-row xl:flex-col items-center xl:items-end justify-between xl:justify-center gap-4 pt-8 xl:pt-0 border-t xl:border-t-0 border-slate-100">
                           <div className="text-right">
                              <p className={`text-6xl font-black leading-none ${isFulfilled ? 'text-emerald-600 line-through' : 'text-slate-900'}`}>{req.unitsNeeded}</p>
                              <p className="text-[11px] font-black text-slate-400 mt-2 uppercase tracking-[0.3em]">Units {isFulfilled ? 'DELIVERED' : 'Priority'}</p>
                           </div>
                        </div>
                      </div>

                      {/* e-RaktKosh Live Sync Module */}
                      {!isFulfilled && (
                        <div className={`p-8 rounded-[2.5rem] border-2 transition-all duration-500 mb-10 ${status ? 'bg-slate-50 border-slate-100' : 'bg-slate-900 border-slate-800 shadow-2xl shadow-slate-900/40'}`}>
                          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex items-center gap-5">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${status ? 'bg-emerald-100 text-emerald-600' : 'bg-white/10 text-white'}`}>
                                {checkingInventory === req.id ? <Loader2 className="w-7 h-7 animate-spin" /> : <Database className="w-7 h-7" />}
                              </div>
                              <div>
                                <p className={`text-[11px] font-black uppercase tracking-[0.2em] mb-1 ${status ? 'text-slate-500' : 'text-slate-400'}`}>Official Government Inventory Relay</p>
                                <h4 className={`text-lg font-black uppercase tracking-tight ${status ? 'text-slate-900' : 'text-white'}`}>
                                  {checkingInventory === req.id ? "Pinging e-RaktKosh Cloud..." : 
                                   status ? `Live Authoritative Stock: ${status.region}` : "Institutional Data Locked"}
                                </h4>
                              </div>
                            </div>

                            {!status && (
                              <button 
                                onClick={() => handleInventoryCheck(req.id, req.hospital)}
                                disabled={checkingInventory === req.id}
                                className="w-full md:w-auto px-10 py-4 bg-red-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-red-700 transition-all shadow-2xl shadow-red-900/40 flex items-center justify-center gap-3"
                              >
                                {checkingInventory === req.id ? "SYNCING..." : <><RefreshCw className="w-4 h-4" /> Query e-RaktKosh</>}
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-5">
                        {!isFulfilled ? (
                          <>
                            <button 
                              onClick={() => onMatch(req)}
                              className="flex-1 bg-slate-900 text-white py-6 rounded-[2rem] text-[12px] font-black uppercase tracking-[0.3em] hover:bg-red-600 transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95 group"
                            >
                              <Stethoscope className="w-6 h-6 group-hover:scale-110 transition-transform" />
                              Launch AI Compatibility Match
                            </button>
                            {user?.role === 'Hospital' && (
                              <button 
                                onClick={() => handleMarkFulfilled(req)}
                                disabled={fulfillingId === req.id}
                                className="flex-1 bg-emerald-600 text-white py-6 rounded-[2rem] text-[12px] font-black uppercase tracking-[0.3em] hover:bg-emerald-700 transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95"
                              >
                                {fulfillingId === req.id ? <Loader2 className="w-6 h-6 animate-spin" /> : <><PackageCheck className="w-6 h-6" /> Mark as Received</>}
                              </button>
                            )}
                          </>
                        ) : (
                          <div className="flex-1 bg-emerald-50 border-2 border-emerald-100 py-6 rounded-[2rem] flex items-center justify-center gap-4 text-emerald-700">
                             <CheckCircle2 className="w-6 h-6" />
                             <span className="text-xs font-black uppercase tracking-widest">Medical Dispatch Fulfilled & Logged</span>
                          </div>
                        )}
                        <a 
                          href={`tel:${req.contact}`}
                          className="sm:w-24 flex items-center justify-center bg-red-600 text-white py-6 sm:py-0 rounded-[2rem] hover:bg-slate-900 transition-all shadow-2xl active:scale-95"
                        >
                          <Smartphone className="w-7 h-7" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyFeed;
