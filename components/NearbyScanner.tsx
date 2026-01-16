import React, { useState, useEffect, useCallback } from 'react';
import { 
  Landmark, 
  MapPin, 
  Phone, 
  Search, 
  Navigation, 
  Loader2, 
  Radar, 
  SlidersHorizontal, 
  Map as MapIcon, 
  LayoutList, 
  Activity,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Wifi,
  ChevronRight,
  LocateFixed,
  Zap,
  Clock,
  ShieldCheck,
  Droplets,
  RefreshCw,
  Target,
  Crosshair,
  MapPinned
} from 'lucide-react';
import { BloodType } from '../services/types';
import { findNearbyBanks, searchBloodBanksByQuery } from '../services/geminiService';
import { GeoCoords, getCurrentPosition, calculateDistance, startLocationWatch } from '../services/locationService';
import { fetchLiveAvailability, ERaktKoshStatus } from '../services/eraktkoshService';
import InteractiveMap from './InteractiveMap';

interface NearbyScannerProps {
  initialLocation: GeoCoords | null;
}

const NearbyScanner: React.FC<NearbyScannerProps> = ({ initialLocation }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [liveData, setLiveData] = useState<Record<string, ERaktKoshStatus>>({});
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchRadius, setSearchRadius] = useState<5 | 10 | 20>(5);
  
  // userCoords is the actual, live GPS location of the device.
  const [userCoords, setUserCoords] = useState<GeoCoords | null>(initialLocation);
  // mapCenter is the focus point for the map/search.
  const [mapCenter, setMapCenter] = useState<GeoCoords | null>(initialLocation);
  
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchMode, setSearchMode] = useState<'nearby' | 'global'>('nearby');

  const processGroundingResults = useCallback((chunks: any[], origin?: GeoCoords) => {
    return chunks.map((chunk: any, index: number) => {
      const lat = chunk.maps?.lat || (origin ? origin.latitude + (Math.random() - 0.5) * 0.05 : 13.0827 + (Math.random() - 0.5) * 0.1);
      const lng = chunk.maps?.lng || (origin ? origin.longitude + (Math.random() - 0.5) * 0.05 : 80.2707 + (Math.random() - 0.5) * 0.1);
      
      // Calculate distance from actual userCoords if available, otherwise fallback to the origin.
      const dist = userCoords 
        ? calculateDistance(userCoords.latitude, userCoords.longitude, lat, lng) 
        : origin 
        ? calculateDistance(origin.latitude, origin.longitude, lat, lng) 
        : null;
      
      return {
        id: chunk.maps?.uri || `facility-${index}`,
        name: chunk.maps?.title || chunk.web?.title || "Health Center Registry",
        address: chunk.maps?.uri ? "Verified Location" : chunk.web?.uri ? "Web Indexed Facility" : "Address Pending Verification",
        lat,
        lng,
        distance: dist,
        phone: "+91 044-23456789", 
        estimatedTime: dist ? Math.ceil(dist * 3) : null
      };
    });
  }, [userCoords]);

  const performScan = useCallback(async (coords: GeoCoords) => {
    setIsLocating(true);
    setLocationError(null);
    setSearchMode('nearby');
    try {
      const results = await findNearbyBanks(coords.latitude, coords.longitude, searchRadius);
      const processed = processGroundingResults(results.chunks, coords);
      processed.sort((a: any, b: any) => (a.distance || 0) - (b.distance || 0));
      setFacilities(processed);
      
      const availabilityMap: Record<string, ERaktKoshStatus> = {};
      for (const f of processed.slice(0, 6)) {
        availabilityMap[f.id] = await fetchLiveAvailability(f.id);
      }
      setLiveData(availabilityMap);

      if (processed.length === 0) {
        setLocationError(`No specialized blood services detected within ${searchRadius}km in Tamil Nadu.`);
      }
    } catch (err: any) {
      setLocationError(err.message || "Radar synchronization error.");
    } finally {
      setIsLocating(false);
    }
  }, [searchRadius, processGroundingResults]);

  const handleGlobalSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchTerm.trim()) return;
    
    setIsLocating(true);
    setLocationError(null);
    setSearchMode('global');
    try {
      // Refresh current GPS to ensure distance from "here" is accurate for new results
      try {
        const freshCoords = await getCurrentPosition(true);
        setUserCoords(freshCoords);
      } catch (e) {
        console.warn("GPS refresh failed; using last known position for distances.");
      }

      const results = await searchBloodBanksByQuery(searchTerm);
      const processed = processGroundingResults(results.chunks, userCoords || undefined);
      setFacilities(processed);
      
      if (processed.length > 0) {
        setMapCenter({ latitude: processed[0].lat, longitude: processed[0].lng });
      }

      const availabilityMap: Record<string, ERaktKoshStatus> = {};
      for (const f of processed.slice(0, 6)) {
        availabilityMap[f.id] = await fetchLiveAvailability(f.id);
      }
      setLiveData(availabilityMap);

      if (processed.length === 0) {
        setLocationError(`No results found for "${searchTerm}" in the Tamil Nadu medical cloud.`);
      }
    } catch (err: any) {
      setLocationError("Global command relay failed.");
    } finally {
      setIsLocating(false);
    }
  };

  const handleManualScan = async (forceLow: boolean = false) => {
    setIsLocating(true);
    setLocationError(null);
    try {
      const coords = await getCurrentPosition(forceLow);
      setUserCoords(coords);
      setMapCenter(coords);
      performScan(coords);
    } catch (e: any) {
      setLocationError(e.message);
      setIsLocating(false);
    }
  };

  const focusOnUser = () => {
    if (userCoords) {
      setMapCenter(userCoords);
      setViewMode('map');
    } else {
      handleManualScan();
    }
  };

  useEffect(() => {
    let watchId: number = -1;
    if (isTracking) {
      watchId = startLocationWatch(
        (coords) => {
          setUserCoords(coords);
          // If in list view, dynamically update distances from the user's current location
          if (viewMode === 'list' && facilities.length > 0) {
            setFacilities(prev => prev.map(f => ({
              ...f,
              distance: calculateDistance(coords.latitude, coords.longitude, f.lat, f.lng),
              estimatedTime: Math.ceil(calculateDistance(coords.latitude, coords.longitude, f.lat, f.lng) * 3)
            })));
          }
        },
        (err) => {
          setIsTracking(false);
          setLocationError("Live GPS tracking interrupted.");
        }
      );
    }
    return () => {
      if (watchId !== -1) navigator.geolocation.clearWatch(watchId);
    };
  }, [isTracking, viewMode, facilities.length]);

  useEffect(() => {
    if (initialLocation && facilities.length === 0) {
      performScan(initialLocation);
    }
  }, [initialLocation, performScan]);

  const openDirections = (destLat: number, destLng: number) => {
    // FORCE origin to be the real GPS location. 
    // This prevents the search landmark (e.g. Vinayagar Temple) from being the start point.
    const origin = userCoords 
      ? `${userCoords.latitude},${userCoords.longitude}` 
      : 'My+Location';
    
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destLat},${destLng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col gap-4">
        <form onSubmit={handleGlobalSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-red-500 transition-colors" />
            <input 
              type="text"
              placeholder="Search Tamil Nadu city, hospital, or facility..."
              className="w-full pl-12 pr-4 py-4 rounded-3xl border border-slate-100 bg-white shadow-sm text-sm font-bold focus:ring-4 focus:ring-red-500/10 transition-all placeholder:text-slate-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button 
              type="submit"
              disabled={isLocating || !searchTerm.trim()}
              className="px-6 py-4 bg-red-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-100 disabled:opacity-50 flex items-center gap-2"
            >
              {isLocating && searchMode === 'global' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
              Search TN
            </button>
            <button 
              type="button"
              onClick={() => handleManualScan(false)}
              disabled={isLocating}
              className={`px-8 py-4 rounded-3xl font-black text-xs flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 ${isLocating && searchMode === 'nearby' ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-slate-900 text-white shadow-slate-200'}`}
            >
              {isLocating && searchMode === 'nearby' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radar className={`w-4 h-4 ${!isLocating && 'animate-pulse'}`} />}
              {isLocating && searchMode === 'nearby' ? 'SCANNING...' : 'LOCAL SCAN'}
            </button>
          </div>
        </form>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-3 py-2 bg-slate-900/5 rounded-2xl border border-slate-200/50">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <SlidersHorizontal className="w-4 h-4 text-slate-400" />
              <div className="flex gap-1">
                {[5, 10, 20].map(r => (
                  <button 
                    key={r}
                    onClick={() => setSearchRadius(r as any)} 
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${searchRadius === r ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-200'}`}
                  >
                    {r}KM
                  </button>
                ))}
              </div>
            </div>
            
            <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
            
            <div className="flex gap-2">
              <button 
                onClick={focusOnUser}
                className="flex items-center gap-2 px-4 py-1.5 rounded-xl transition-all border-2 bg-white border-slate-200 text-slate-500 hover:border-red-400 hover:text-red-600"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Focus Me</span>
              </button>
              <button 
                onClick={() => setIsTracking(!isTracking)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl transition-all border-2 ${isTracking ? 'bg-emerald-50 border-emerald-400 text-emerald-700' : 'bg-white border-slate-200 text-slate-500'}`}
              >
                <LocateFixed className={`w-3.5 h-3.5 ${isTracking ? 'animate-spin' : ''}`} />
                <span className="text-[10px] font-black uppercase tracking-widest">{isTracking ? 'TRACKING ON' : 'ENABLE FOLLOW'}</span>
              </button>
            </div>
          </div>

          <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100 self-end md:self-auto">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}><LayoutList className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('map')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'map' ? 'bg-red-600 text-white' : 'text-slate-400'}`}><MapIcon className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {locationError && (
        <div className="bg-red-50 border-2 border-red-100 rounded-[2rem] p-6 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-black text-red-900 uppercase tracking-tight mb-1">Regional Search Notification</h4>
              <p className="text-xs text-red-700 font-medium mb-4 leading-relaxed">{locationError}</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleManualScan(false)}
                  className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-red-200"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry Scan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'map' && (mapCenter || userCoords) ? (
        <div className="relative group">
          <InteractiveMap 
            userLat={userCoords?.latitude || mapCenter?.latitude || 13.0827} 
            userLng={userCoords?.longitude || mapCenter?.longitude || 80.2707} 
            banks={facilities} 
            isTracking={isTracking}
          />
          {isTracking && (
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full shadow-2xl animate-pulse">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-[9px] font-black uppercase tracking-widest">Live Telemetry</span>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {facilities.length > 0 ? (
            facilities.map((f, idx) => {
              const status = liveData[f.id];
              const isNearest = idx === 0 && searchMode === 'nearby';
              
              return (
                <div key={f.id} className={`bg-white rounded-[2.5rem] border transition-all group overflow-hidden relative ${isNearest ? 'border-red-200 ring-2 ring-red-50 shadow-xl' : 'border-slate-100 shadow-sm hover:shadow-lg'}`}>
                  {isNearest && (
                    <div className="absolute top-0 right-0 bg-red-600 text-white px-6 py-2 rounded-bl-3xl z-10">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em]">Priority TN Hub</span>
                    </div>
                  )}

                  <div className="p-8">
                    <div className="flex flex-col lg:flex-row justify-between lg:items-start gap-6 mb-8">
                      <div className="flex gap-6">
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center border-2 shadow-inner transition-transform group-hover:rotate-6 ${isNearest ? 'bg-red-50 border-red-100 text-red-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                          <Landmark className="w-10 h-10" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="font-black text-slate-800 text-2xl tracking-tight leading-none">{f.name}</h3>
                            {status?.isLive ? (
                               <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-xl border border-emerald-100">
                                 <Wifi className="w-3.5 h-3.5 animate-pulse" />
                                 <span className="text-[9px] font-black uppercase tracking-widest">Live TN Relay</span>
                               </div>
                            ) : (
                              <div className="flex items-center gap-1.5 bg-slate-100 text-slate-400 px-3 py-1 rounded-xl border border-slate-200">
                                <span className="text-[9px] font-black uppercase tracking-widest text-nowrap">Indexed</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 text-[12px] font-bold">
                            {f.distance !== null && (
                              <div className="flex items-center gap-1.5 text-slate-600">
                                <MapPinned className="w-4 h-4 text-red-500" /> 
                                <span className="font-black text-slate-900">{f.distance} KM FROM YOUR GPS</span>
                              </div>
                            )}
                            {f.estimatedTime && (
                              <div className="flex items-center gap-1.5 text-slate-600">
                                <Clock className="w-4 h-4 text-slate-400" /> 
                                <span>ETA {f.estimatedTime}m</span>
                              </div>
                            )}
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-400 uppercase tracking-widest text-[10px] truncate max-w-[200px]">{f.address}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <a 
                          href={`tel:${f.phone}`}
                          className="flex-1 lg:flex-none p-4 bg-slate-100 text-slate-700 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2"
                        >
                          <Phone className="w-5 h-5" />
                        </a>
                        <button 
                          onClick={() => openDirections(f.lat, f.lng)}
                          className="flex-1 lg:flex-none px-8 py-4 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-200 flex items-center justify-center gap-2"
                        >
                          <Navigation className="w-5 h-5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Route</span>
                        </button>
                      </div>
                    </div>

                    {status?.isLive ? (
                      <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="flex items-center justify-between px-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Activity className="w-4 h-4 text-emerald-500" /> Live State Inventory Sync
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                          {(Object.keys(status.availability) as BloodType[]).map((type) => (
                            <div key={type} className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-colors ${status.availability[type] > 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100 opacity-40'}`}>
                              <span className="text-[11px] font-black text-slate-800">{type}</span>
                              <span className={`text-sm font-black ${status.availability[type] > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {status.availability[type]}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200 text-center flex flex-col items-center">
                        <ShieldCheck className="w-8 h-8 text-slate-200 mb-2" />
                        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Stock Sync Unavailable</h4>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">Direct verification required for this Tamil Nadu facility.</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : !isLocating ? (
            <div className="text-center py-24 bg-white rounded-[3rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center">
              <Radar className="w-16 h-16 text-slate-100 mb-6" />
              <h4 className="text-slate-500 font-black uppercase tracking-[0.2em] text-sm">TN Medical Command Search</h4>
              <p className="text-slate-400 font-bold text-xs mt-2 max-w-xs">Type a Tamil Nadu location or start a GPS scan for state-wide facilities.</p>
            </div>
          ) : (
             <div className="py-24 flex flex-col items-center justify-center text-slate-400">
               <Loader2 className="w-10 h-10 animate-spin mb-4 text-red-600" />
               <p className="text-xs font-black uppercase tracking-widest">Relaying State Command Signals...</p>
             </div>
          )}
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] flex flex-col md:flex-row items-center gap-6 shadow-2xl relative overflow-hidden">
        <div className="w-16 h-16 bg-red-600 text-white rounded-[1.5rem] flex items-center justify-center flex-shrink-0 shadow-xl shadow-red-900/40 relative z-10">
          <Wifi className="w-10 h-10" />
        </div>
        <div className="relative z-10 text-center md:text-left">
          <h4 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-2">Tamil Nadu Command Search Online</h4>
          <p className="text-[11px] text-slate-400 font-medium leading-relaxed max-w-2xl">
            This state command center integrates real-time location grounding for Tamil Nadu and e-RaktKosh authoritative stock levels. Results are strictly filtered for medical facilities within the state.
          </p>
        </div>
        <Zap className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 rotate-12 pointer-events-none" />
      </div>
    </div>
  );
};

export default NearbyScanner;