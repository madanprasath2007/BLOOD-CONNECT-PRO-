
import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Landmark, Heart, User, Navigation, ExternalLink, Zap, CheckCircle2, Loader2, Calendar, MapPin, Activity, Target, Info, ShieldCheck, Wifi, Droplets, Clock } from 'lucide-react';
import { calculateDistance } from '../services/locationService';
import { fetchLiveAvailability, ERaktKoshStatus } from '../services/eraktkoshService';

// Professional Clinical Icon Engine
const createIcon = (color: string, iconType: 'bank' | 'drive' | 'user', isLive?: boolean, isConfirmed?: boolean, isSelected?: boolean) => {
  const finalColor = isConfirmed ? '#10b981' : isSelected ? '#dc2626' : color;
  const iconHtml = `
    <div class="relative flex items-center justify-center" style="width: 44px; height: 44px;">
      ${(isLive || isConfirmed || isSelected) ? `<div class="absolute inset-0 ${isConfirmed ? 'bg-emerald-500/20' : 'bg-red-500/30'} rounded-full animate-pulse"></div>` : ''}
      ${isSelected ? `<div class="absolute inset-[-8px] bg-red-500/20 rounded-full animate-ping"></div>` : ''}
      <div class="relative z-10" style="background-color: ${finalColor}; width: 38px; height: 38px; border-radius: 14px; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.2); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          ${isConfirmed ? '<path d="M20 6L9 17l-5-5"/>' : 
            iconType === 'bank' ? '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>' : 
            iconType === 'drive' ? '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>' :
            '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>'}
        </svg>
      </div>
    </div>
  `;
  return L.divIcon({
    className: 'custom-marker',
    html: iconHtml,
    iconSize: [44, 44],
    iconAnchor: [22, 44],
    popupAnchor: [0, -44]
  });
};

const RecenterMap = ({ lat, lng, isTracking }: { lat: number, lng: number, isTracking?: boolean }) => {
  const map = useMap();
  useEffect(() => {
    if (isTracking) {
      map.flyTo([lat, lng], 14, { duration: 1.5 });
    } else {
      map.setView([lat, lng], 13);
    }
  }, [lat, lng, map, isTracking]);
  return null;
};

interface MapProps {
  userLat: number;
  userLng: number;
  banks?: any[];
  drives?: any[];
  isTracking?: boolean;
  onSelectDrive?: (drive: any) => void;
  reservingId?: string | null;
  confirmedId?: string | null;
}

const InteractiveMap: React.FC<MapProps> = ({ 
  userLat, 
  userLng, 
  banks = [], 
  drives = [], 
  isTracking = false,
  onSelectDrive,
  reservingId,
  confirmedId
}) => {
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [bankStatuses, setBankStatuses] = useState<Record<string, ERaktKoshStatus>>({});
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  
  const getDirectionsUrl = (destLat: number, destLng: number) => {
    return `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${destLat},${destLng}&travelmode=driving`;
  };

  const handleBankClick = async (bank: any) => {
    const bankId = bank.id || `${bank.lat}-${bank.lng}`;
    setSelectedBankId(bankId);
    
    if (!bankStatuses[bankId]) {
      setLoadingStatus(bankId);
      try {
        const status = await fetchLiveAvailability(bank.name);
        setBankStatuses(prev => ({ ...prev, [bankId]: status }));
      } catch (error) {
        console.error("Live status fetch failed", error);
      } finally {
        setLoadingStatus(null);
      }
    }
  };

  const confirmedDrive = useMemo(() => {
    return drives.find(d => d.id === confirmedId);
  }, [drives, confirmedId]);

  return (
    <div className="w-full h-[600px] md:h-[700px] rounded-[3.5rem] overflow-hidden border-4 border-white shadow-3xl bg-slate-100 relative z-0 group">
      {/* HUD - Map Command Panel */}
      <div className="absolute top-6 left-6 z-20 flex flex-col gap-3">
        <div className="bg-slate-900/95 backdrop-blur-xl text-white px-6 py-4 rounded-3xl shadow-2xl border border-white/10 flex items-center gap-4 transition-all hover:bg-slate-900">
          <div className="w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Target className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1 text-slate-400">Command Center</p>
            <h4 className="text-xs font-black uppercase tracking-widest">{drives.length + banks.length} Fulfillment Nodes Active</h4>
          </div>
        </div>

        {reservingId && (
          <div className="bg-white/95 backdrop-blur-xl text-slate-900 px-6 py-4 rounded-3xl shadow-2xl border border-red-100 flex items-center gap-4 animate-in slide-in-from-left-4">
            <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-red-600 animate-spin" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-0.5">Secure Booking</p>
              <h4 className="text-[11px] font-black uppercase tracking-tight">Syncing Slot with Node...</h4>
            </div>
          </div>
        )}

        {confirmedId && confirmedDrive && (
          <div className="bg-emerald-600 backdrop-blur-xl text-white px-6 py-4 rounded-3xl shadow-2xl border border-emerald-400 flex items-center gap-4 animate-in zoom-in">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100 mb-0.5">Active Tracking</p>
              <h4 className="text-[11px] font-black uppercase tracking-tight">
                {calculateDistance(userLat, userLng, confirmedDrive.coordinates.lat, confirmedDrive.coordinates.lng)} KM TO GO
              </h4>
            </div>
          </div>
        )}
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-8 left-8 z-20">
        <div className="bg-white/90 backdrop-blur-xl p-5 rounded-[2rem] shadow-2xl border border-white/40 space-y-3 min-w-[200px]">
          <div className="flex items-center gap-3 mb-1 px-1">
            <Info className="w-4 h-4 text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Node Legend</span>
          </div>
          
          <div className="flex items-center gap-3 group/item cursor-default">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center border-2 border-white shadow-md">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Live Position</span>
          </div>

          <div className="flex items-center gap-3 group/item cursor-default">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center border-2 border-white shadow-md">
              <Landmark className="w-4 h-4 text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Medical Center</span>
          </div>

          <div className="flex items-center gap-3 group/item cursor-default">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center border-2 border-white shadow-md">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Community Drive</span>
          </div>

          <div className="flex items-center gap-3 group/item cursor-default">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center border-2 border-white shadow-md">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Reserved Destination</span>
          </div>
        </div>
      </div>

      <MapContainer center={[userLat, userLng]} zoom={13} scrollWheelZoom={false} zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <RecenterMap lat={userLat} lng={userLng} isTracking={isTracking} />

        {/* Dynamic Tracking Line */}
        {confirmedDrive && (
          <Polyline 
            positions={[
              [userLat, userLng],
              [confirmedDrive.coordinates.lat, confirmedDrive.coordinates.lng]
            ]} 
            pathOptions={{ color: '#10b981', weight: 4, dashArray: '10, 10', opacity: 0.7 }} 
          />
        )}

        {/* 10km Response Zone Overlay */}
        <Circle 
          center={[userLat, userLng]} 
          radius={5000} 
          pathOptions={{ fillColor: '#ef4444', color: '#ef4444', weight: 1, opacity: 0.1, fillOpacity: 0.05 }} 
        />
        
        {/* User Marker */}
        <Marker position={[userLat, userLng]} icon={createIcon('#3b82f6', 'user')}>
          <Popup className="custom-popup">
            <div className="p-4 text-center">
              <div className="flex items-center gap-2 justify-center mb-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Live Relay Node</p>
              </div>
              <p className="text-sm font-black text-slate-800 tracking-tight">Your Real-time Position</p>
            </div>
          </Popup>
        </Marker>

        {/* Drive Markers */}
        {drives.map((drive, i) => {
          const isLive = drive.date === 'TODAY';
          const isConfirmed = confirmedId === drive.id;
          return (
            <Marker 
              key={`drive-${i}`} 
              position={[drive.coordinates.lat, drive.coordinates.lng]} 
              icon={createIcon(isLive ? '#dc2626' : '#f59e0b', 'drive', isLive, isConfirmed)}
            >
              <Popup>
                <div className="p-5 min-w-[280px]">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-lg font-black text-slate-900 leading-tight flex-1">{drive.title}</h4>
                    {isLive && !isConfirmed && (
                      <span className="flex items-center gap-1 text-[9px] font-black bg-red-50 text-red-600 px-2.5 py-1 rounded-lg border border-red-100 uppercase tracking-widest">Live</span>
                    )}
                    {isConfirmed && (
                      <span className="flex items-center gap-1 text-[9px] font-black bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg border border-emerald-100 uppercase tracking-widest">Reserved</span>
                    )}
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                      <Calendar className="w-4 h-4 text-slate-300" />
                      <span>{drive.date}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                      <MapPin className="w-4 h-4 text-slate-300" />
                      <span className="truncate">{drive.location}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
                    {onSelectDrive && (
                      <button
                        onClick={() => onSelectDrive(drive)}
                        disabled={reservingId === drive.id || confirmedId === drive.id}
                        className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all ${
                          confirmedId === drive.id 
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : 'bg-red-600 text-white hover:bg-slate-900 shadow-xl shadow-red-100 active:scale-95'
                        }`}
                      >
                        {reservingId === drive.id ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Syncing Appointment...</>
                        ) : confirmedId === drive.id ? (
                          <><CheckCircle2 className="w-4 h-4" /> Slot Confirmed</>
                        ) : (
                          <><Heart className="w-4 h-4" /> Reserve Slot Now</>
                        )}
                      </button>
                    )}

                    <a 
                      href={getDirectionsUrl(drive.coordinates.lat, drive.coordinates.lng)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors mt-1"
                    >
                      Route <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Bank/Hospital Markers */}
        {banks.map((bank, i) => {
          const bankId = bank.id || `${bank.lat}-${bank.lng}`;
          const isSelected = selectedBankId === bankId;
          const status = bankStatuses[bankId];
          const isLoading = loadingStatus === bankId;

          return (
            <Marker 
              key={`bank-${i}`} 
              position={[bank.lat, bank.lng]} 
              icon={createIcon('#dc2626', 'bank', false, false, isSelected)}
              eventHandlers={{
                click: () => handleBankClick(bank)
              }}
            >
              <Popup>
                <div className="p-5 min-w-[300px]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Landmark className="w-5 h-5 text-red-600" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Medical Facility</span>
                    </div>
                    {status?.isLive && (
                       <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-lg border border-emerald-100">
                         <Wifi className="w-3 h-3 animate-pulse" />
                         <span className="text-[8px] font-black uppercase tracking-widest">Live TN Relay</span>
                       </div>
                    )}
                  </div>
                  
                  <h4 className="text-lg font-black text-slate-900 mb-2 leading-tight">{bank.name}</h4>
                  
                  <div className="flex items-start gap-3 text-xs font-bold text-slate-500 mb-6">
                    <MapPin className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
                    <span className="leading-relaxed">{bank.address || bank.location?.address || 'Full Address Pending Verification'}</span>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-6 gap-3">
                        <Loader2 className="w-5 h-5 text-red-600 animate-spin" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Querying e-RaktKosh...</span>
                      </div>
                    ) : status ? (
                      <div className="animate-in fade-in duration-300">
                        <div className="flex items-center justify-between mb-3 px-1">
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                             <Droplets className="w-3 h-3 text-red-500" /> Current Stock
                           </span>
                           <span className="text-[8px] font-bold text-slate-300 uppercase">Ref: {status.hospitalId}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                           {Object.entries(status.availability).map(([type, count]) => (
                             /* Fix: Cast count to number to resolve Operator '>' cannot be applied to types 'unknown' and 'number' error */
                             <div key={type} className={`flex flex-col items-center justify-center p-2 rounded-xl border ${(count as number) > 0 ? 'bg-slate-50 border-slate-200' : 'bg-slate-50/50 border-slate-100 opacity-40'}`}>
                               <span className="text-[10px] font-black text-slate-700">{type}</span>
                               <span className={`text-[11px] font-black ${(count as number) > 0 ? 'text-red-600' : 'text-slate-400'}`}>{count as number}</span>
                             </div>
                           ))}
                        </div>
                        <div className="mt-4 flex items-center justify-between text-[9px] font-bold text-slate-400 px-1">
                          <div className="flex items-center gap-1">
                             <Clock className="w-3 h-3" /> Sync: {status.lastUpdated}
                          </div>
                          <span className="text-emerald-600">STATE NODAL HEALTH: OPTIMAL</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] font-bold text-slate-400 text-center py-2">Click to verify live supply chain availability</p>
                    )}

                    <div className="flex gap-2 pt-2">
                      <a 
                        href={getDirectionsUrl(bank.lat, bank.lng)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-red-600 transition-all shadow-xl active:scale-95"
                      >
                        <Navigation className="w-4 h-4" /> Start Tactical Route
                      </a>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default InteractiveMap;
