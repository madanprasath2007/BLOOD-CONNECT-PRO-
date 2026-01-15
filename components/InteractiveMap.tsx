
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Landmark, Heart, User, Navigation, ExternalLink, Zap, CheckCircle2, Loader2, Calendar, MapPin, Activity, Target } from 'lucide-react';
import { calculateDistance } from '../services/locationService';

// Professional Clinical Icon Engine
const createIcon = (color: string, iconType: 'bank' | 'drive' | 'user', isLive?: boolean) => {
  const iconHtml = `
    <div class="relative flex items-center justify-center" style="width: 44px; height: 44px;">
      ${isLive ? '<div class="absolute inset-0 bg-red-500/30 rounded-full animate-ping"></div>' : ''}
      <div class="relative z-10" style="background-color: ${color}; width: 38px; height: 38px; border-radius: 14px; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.2);">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          ${iconType === 'bank' ? '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>' : 
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
  
  const getDirectionsUrl = (destLat: number, destLng: number) => {
    return `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${destLat},${destLng}&travelmode=driving`;
  };

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
      </div>

      <MapContainer center={[userLat, userLng]} zoom={13} scrollWheelZoom={false} zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <RecenterMap lat={userLat} lng={userLng} isTracking={isTracking} />

        {/* 10km Response Zone Overlay */}
        <Circle 
          center={[userLat, userLng]} 
          radius={5000} 
          pathOptions={{ fillColor: '#ef4444', color: '#ef4444', weight: 1, opacity: 0.1, fillOpacity: 0.05 }} 
        />
        <Circle 
          center={[userLat, userLng]} 
          radius={1000} 
          pathOptions={{ fillColor: '#3b82f6', color: '#3b82f6', weight: 1, opacity: 0.2, fillOpacity: 0.1 }} 
        />
        
        {/* User Marker */}
        <Marker position={[userLat, userLng]} icon={createIcon('#3b82f6', 'user')}>
          <Popup className="custom-popup">
            <div className="p-4 text-center">
              <div className="flex items-center gap-2 justify-center mb-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Global Relay Node</p>
              </div>
              <p className="text-sm font-black text-slate-800 tracking-tight">Your Verified Position</p>
            </div>
          </Popup>
        </Marker>

        {/* Drive Markers */}
        {drives.map((drive, i) => {
          const isLive = drive.date === 'TODAY';
          return (
            <Marker 
              key={`drive-${i}`} 
              position={[drive.coordinates.lat, drive.coordinates.lng]} 
              icon={createIcon(isLive ? '#dc2626' : '#f59e0b', 'drive', isLive)}
            >
              <Popup>
                <div className="p-5 min-w-[280px]">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-lg font-black text-slate-900 leading-tight flex-1">{drive.title}</h4>
                    {isLive && (
                      <span className="flex items-center gap-1 text-[9px] font-black bg-red-50 text-red-600 px-2.5 py-1 rounded-lg border border-red-100 uppercase tracking-widest">Live</span>
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
                    <div className="flex items-center gap-3 text-xs font-bold text-emerald-600">
                      <Navigation className="w-4 h-4" />
                      <span>{calculateDistance(userLat, userLng, drive.coordinates.lat, drive.coordinates.lng)} KM from you</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
                    {onSelectDrive && (
                      <button
                        onClick={() => onSelectDrive(drive)}
                        disabled={reservingId === drive.id}
                        className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all ${
                          confirmedId === drive.id 
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : 'bg-red-600 text-white hover:bg-slate-900 shadow-xl shadow-red-100 active:scale-95'
                        }`}
                      >
                        {reservingId === drive.id ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Syncing Appointment...</>
                        ) : confirmedId === drive.id ? (
                          <><CheckCircle2 className="w-4 h-4" /> Slot Reserved</>
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
      </MapContainer>
    </div>
  );
};

export default InteractiveMap;
