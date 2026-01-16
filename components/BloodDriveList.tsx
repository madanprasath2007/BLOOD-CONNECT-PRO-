
import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, Users, MapPin, ChevronRight, Map as MapIcon, LayoutList, CheckCircle2, Loader2, PlusCircle, X, ShieldCheck, Activity, Landmark, Heart, Search, LocateFixed, Navigation, ExternalLink, Radar, Zap, Radio, Target, Gauge, Navigation2, Send, ClipboardList } from 'lucide-react';
import { BloodDrive, AuthenticatedUser } from '../services/types';
import InteractiveMap from './InteractiveMap';
import { GeoCoords, calculateDistance } from '../services/locationService';

const getFutureDate = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  if (days === 0) return 'TODAY';
  if (days === 1) return 'TOMORROW';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const INITIAL_DRIVES: BloodDrive[] = [
  { id: 'tn-01', title: 'Chennai Marina Life Camp', organizer: 'TN Govt Health Dept', date: getFutureDate(0), location: 'Marina Beach Ground, Chennai', description: 'Priority blood collection for government hospitals. All groups welcome.', coordinates: { lat: 13.0475, lng: 80.2824 } },
  { id: 'tn-02', title: 'Coimbatore Industrial Drive', organizer: 'KG Hospital', date: getFutureDate(1), location: 'Codissia Trade Centre, Coimbatore', description: 'Corporate blood drive targeting industrial workers and families.', coordinates: { lat: 11.0401, lng: 77.0315 } },
  { id: 'tn-03', title: 'Madurai Temple City Camp', organizer: 'Meenakshi Mission', date: getFutureDate(2), location: 'Anna Nagar, Madurai', description: 'Community drive focused on Rare Negative groups (O-, A-, B-).', coordinates: { lat: 9.9252, lng: 78.1198 } },
  { id: 'tn-04', title: 'Trichy Regional Health Meet', organizer: 'Apollo Trichy', date: getFutureDate(3), location: 'Chatiram Bus Stand, Tiruchirappalli', description: 'Urgent need for O+ and B+ units for regional supply chain.', coordinates: { lat: 10.8291, lng: 78.6917 } },
  { id: 'tn-05', title: 'Salem Steel City Drive', organizer: 'Manipal Hospital', date: getFutureDate(4), location: 'Five Roads, Salem', description: 'Annual donation event. Certificates and refreshments provided.', coordinates: { lat: 11.6643, lng: 78.1460 } },
  { id: 'tn-06', title: 'Erode Textile Hub Camp', organizer: 'Lotus Hospital', date: getFutureDate(5), location: 'Erode Central Hub', description: 'Critical platelet collection drive for dengue season.', coordinates: { lat: 11.3410, lng: 77.7172 } },
];

interface BloodDriveListProps {
  onNotify?: (text: string, type?: 'info' | 'success' | 'alert') => void;
  user?: AuthenticatedUser;
  initialLocation?: GeoCoords | null;
}

const BloodDriveList: React.FC<BloodDriveListProps> = ({ onNotify, user, initialLocation }) => {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [filterText, setFilterText] = useState('');
  const [drivesList, setDrivesList] = useState<BloodDrive[]>(INITIAL_DRIVES);
  const [reservingId, setReservingId] = useState<string | null>(null);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [signalStrength, setSignalStrength] = useState(0);
  const [isHosting, setIsHosting] = useState(false);
  
  // Host Camp Form State
  const [hostFormData, setHostFormData] = useState({
    title: '',
    location: '',
    description: '',
    date: ''
  });

  useEffect(() => {
    if (confirmedId) {
      const interval = setInterval(() => {
        setSignalStrength(prev => (prev + 1) % 4);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [confirmedId]);

  const filteredDrives = useMemo(() => {
    return drivesList.filter(d => 
      d.title.toLowerCase().includes(filterText.toLowerCase()) || 
      d.location.toLowerCase().includes(filterText.toLowerCase())
    );
  }, [drivesList, filterText]);

  const handleReserve = (drive: BloodDrive) => {
    if (confirmedId === drive.id) return;
    setReservingId(drive.id);
    setTimeout(() => {
      setReservingId(null);
      setConfirmedId(drive.id);
      onNotify?.(`Slot Confirmed: ${drive.title} at ${drive.location}. Tactical route locked on live location.`, 'success');
    }, 1200);
  };

  const handleHostCampSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newDrive: BloodDrive = {
      id: `drive-${Date.now()}`,
      title: hostFormData.title,
      organizer: user?.name || 'Local Registry',
      date: hostFormData.date === new Date().toISOString().split('T')[0] ? 'TODAY' : hostFormData.date,
      location: hostFormData.location,
      description: hostFormData.description,
      coordinates: initialLocation ? { lat: initialLocation.latitude, lng: initialLocation.longitude } : { lat: 13.0827, lng: 80.2707 }
    };
    
    setDrivesList(prev => [newDrive, ...prev]);
    setIsHosting(false);
    onNotify?.(`Community Camp "${newDrive.title}" has been successfully broadcasted.`, 'success');
    setHostFormData({ title: '', location: '', description: '', date: '' });
  };

  const openDirections = (drive: BloodDrive) => {
    const origin = initialLocation 
      ? `${initialLocation.latitude},${initialLocation.longitude}` 
      : 'My+Location';
    const dest = `${drive.coordinates.lat},${drive.coordinates.lng}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Tamil Nadu Drives</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{filteredDrives.length} State-Level Facilities Synced</p>
        </div>
        <div className="flex gap-2">
          {user?.role === 'BloodBank' && (
            <button 
              onClick={() => setIsHosting(true)}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 shadow-xl transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" /> Host Camp
            </button>
          )}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-sm">
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-md border border-slate-100' : 'text-slate-400'}`}>
              <LayoutList className="w-5 h-5" />
            </button>
            <button onClick={() => setViewMode('map')} className={`p-2 rounded-xl transition-all ${viewMode === 'map' ? 'bg-white text-red-600 shadow-md border border-slate-100' : 'text-slate-400'}`}>
              <MapIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search Tamil Nadu by city or camp name..."
            className="w-full pl-12 pr-6 py-4 rounded-2xl border border-slate-100 bg-white shadow-sm text-sm font-bold focus:ring-4 focus:ring-red-500/10 transition-all"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>
        <button onClick={() => setViewMode('map')} className="px-6 py-4 bg-white border border-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 flex items-center gap-2 shadow-sm">
          <LocateFixed className="w-4 h-4" /> State View
        </button>
      </div>
      
      {viewMode === 'map' && (initialLocation || INITIAL_DRIVES[0]) ? (
        <div className="animate-in zoom-in duration-500">
          <InteractiveMap 
            userLat={initialLocation?.latitude || 13.0827} 
            userLng={initialLocation?.longitude || 80.2707} 
            drives={filteredDrives} 
            onSelectDrive={handleReserve}
            reservingId={reservingId}
            confirmedId={confirmedId}
          />
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredDrives.map(drive => {
            const isConfirmed = confirmedId === drive.id;
            const dist = initialLocation ? calculateDistance(initialLocation.latitude, initialLocation.longitude, drive.coordinates.lat, drive.coordinates.lng) : null;

            return (
              <div key={drive.id} className={`bg-white border rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col md:flex-row justify-between gap-8 ${isConfirmed ? 'border-emerald-200 ring-4 ring-emerald-50 bg-emerald-50/5' : 'border-slate-100'}`}>
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] ${isConfirmed ? 'bg-emerald-600 text-white' : drive.date === 'TODAY' ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
                      {isConfirmed ? 'Tactical Lock Active' : drive.date === 'TODAY' ? 'Live Session' : drive.date}
                    </div>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{drive.organizer}</span>
                  </div>
                  <div>
                    <h3 className={`font-black text-2xl tracking-tight leading-none mb-2 ${isConfirmed ? 'text-emerald-700' : 'text-slate-800 group-hover:text-red-600'}`}>{drive.title}</h3>
                    <p className="text-slate-500 text-xs font-medium leading-relaxed max-w-lg">{drive.description}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 pt-2">
                    <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      <MapPin className="w-3.5 h-3.5 text-red-400" /> {drive.location}
                    </div>
                    {dist !== null && (
                      <div className="flex items-center gap-2 text-[11px] font-black text-emerald-600 uppercase tracking-widest">
                        <Activity className="w-3.5 h-3.5 animate-pulse" /> {dist} KM FROM LIVE LOCATION
                      </div>
                    )}
                  </div>

                  {isConfirmed && (
                    <div className="mt-6 p-6 bg-slate-900 rounded-[2rem] text-white border border-slate-800 shadow-2xl animate-in slide-in-from-bottom-4 duration-500 relative overflow-hidden">
                      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30">
                              <Radar className="w-7 h-7 text-emerald-400 animate-pulse" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 flex gap-0.5">
                              {[0, 1, 2, 3].map(i => (
                                <div key={i} className={`w-1 h-3 rounded-full transition-all ${i <= signalStrength ? 'bg-emerald-400 shadow-sm' : 'bg-slate-700'}`}></div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">Live Deployment Tracking</p>
                            <div className="flex items-center gap-2">
                               <h4 className="text-sm font-black uppercase tracking-tight">Active: {drive.title}</h4>
                               <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                            </div>
                            <div className="flex flex-col gap-0.5 mt-2">
                               <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                  <Navigation2 className="w-3 h-3 rotate-45" /> {dist} KM TO DESTINATION (LIVE)
                               </div>
                               <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                                     <Radio className="w-3 h-3" /> PRECISION-GPS
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                                     <Target className="w-3 h-3" /> TRACKING: {drive.coordinates.lat.toFixed(4)}, {drive.coordinates.lng.toFixed(4)}
                                  </div>
                               </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 w-full md:w-auto">
                          <button 
                            onClick={() => openDirections(drive)}
                            className="flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 shadow-xl shadow-emerald-900/40 transition-all active:scale-95"
                          >
                            <Navigation className="w-4 h-4" /> Open Live Maps
                          </button>
                        </div>
                      </div>
                      <Zap className="absolute -top-10 -right-10 w-32 h-32 text-white/5 rotate-12 pointer-events-none" />
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col justify-between items-end gap-6">
                  <div className="flex -space-x-3">
                    {[1, 2, 3].map(i => (
                      <img key={i} src={`https://i.pravatar.cc/100?u=${drive.id}-${i}`} className="w-10 h-10 rounded-full border-4 border-white shadow-sm" alt="donor" />
                    ))}
                    <div className="w-10 h-10 rounded-full bg-slate-50 border-4 border-white flex items-center justify-center text-[9px] font-black text-slate-400">+12</div>
                  </div>
                  
                  <div className="flex flex-col gap-2 w-full min-w-[180px]">
                    <button 
                      onClick={() => handleReserve(drive)}
                      disabled={reservingId === drive.id || isConfirmed}
                      className={`w-full px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
                        isConfirmed 
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
                        : 'bg-slate-900 text-white hover:bg-red-600 shadow-xl active:scale-95'
                      }`}
                    >
                      {reservingId === drive.id ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> LOCKING GPS...</>
                      ) : isConfirmed ? (
                        <><CheckCircle2 className="w-4 h-4" /> DEPLOYMENT ACTIVE</>
                      ) : (
                        <span className="flex items-center gap-2">RESERVE SLOT <ChevronRight className="w-4 h-4" /></span>
                      )}
                    </button>
                    
                    {isConfirmed && (
                      <button 
                        onClick={() => setConfirmedId(null)}
                        className="w-full text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-red-600 transition-colors py-1"
                      >
                        Abort Deployment
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Host Camp Modal */}
      {isHosting && (
        <div 
          onClick={() => setIsHosting(false)}
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
          >
            <div className="bg-slate-900 p-8 text-white relative">
              <div className="relative z-10 flex items-center gap-3">
                <div className="p-2.5 bg-red-600 rounded-xl">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight uppercase">Launch Community Drive</h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Broadcast to All Regional Donors</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsHosting(false)}
                className="absolute top-8 right-8 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all z-[160]"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleHostCampSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Camp Title</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Marina Beach Life Camp"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                    value={hostFormData.title}
                    onChange={e => setHostFormData({...hostFormData, title: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Location</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Anna Nagar"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                      value={hostFormData.location}
                      onChange={e => setHostFormData({...hostFormData, location: e.target.value})}
                    />
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Event Date</label>
                    <input 
                      type="date" 
                      required 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                      value={hostFormData.date}
                      onChange={e => setHostFormData({...hostFormData, date: e.target.value})}
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Short Description</label>
                  <textarea 
                    rows={3}
                    placeholder="Describe specific needs or special instructions..."
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all resize-none"
                    value={hostFormData.description}
                    onChange={e => setHostFormData({...hostFormData, description: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] hover:bg-red-700 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-red-100"
                >
                  <Send className="w-4 h-4" /> Initiate Network Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BloodDriveList;
