
import React, { useState, useMemo } from 'react';
import { Calendar, Users, MapPin, ChevronRight, Map as MapIcon, LayoutList, CheckCircle2, Loader2, PlusCircle, X, ShieldCheck, Activity, Landmark, Heart, Search, LocateFixed } from 'lucide-react';
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
  { id: 'cd1', title: 'Mega Donation Camp 2024', organizer: 'Lions Club', date: getFutureDate(0), location: 'City Park North', description: 'Join us for the largest blood drive of the season. Special focus on Rare O- types.', coordinates: { lat: 28.6139, lng: 77.2090 } },
  { id: 'cd2', title: 'Corporate Lifesavers', organizer: 'Tech Mahindra', date: getFutureDate(1), location: 'Tech Park Wing A', description: 'Exclusive for employees and families. Platelet donation kits available.', coordinates: { lat: 28.5355, lng: 77.3910 } },
  { id: 'cd3', title: 'University Youth Drive', organizer: 'Delhi University', date: getFutureDate(2), location: 'Faculty of Arts', description: 'Encouraging young donors to make an impact. Refreshments provided.', coordinates: { lat: 28.6863, lng: 77.2217 } },
  { id: 'cd4', title: 'Rotary Club Blood Drive', organizer: 'Rotary South', date: getFutureDate(3), location: 'South Ex Plaza', description: 'Annual community drive with state-of-the-art collection vans.', coordinates: { lat: 28.5684, lng: 77.2214 } },
  { id: 'cd5', title: 'Metro Hospital Collection', organizer: 'Metro Healthcare', date: getFutureDate(4), location: 'Noida Sector 62', description: 'Urgent need for B+ and AB- groups for upcoming surgical week.', coordinates: { lat: 28.6190, lng: 77.3610 } },
  { id: 'cd6', title: 'Cyber Hub Donor Hub', organizer: 'Fortis Group', date: getFutureDate(5), location: 'Gurgaon Cyber City', description: 'Walk-in donation center located near the main amphitheater.', coordinates: { lat: 28.4950, lng: 77.0890 } },
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
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredDrives = useMemo(() => {
    return drivesList.filter(d => 
      d.title.toLowerCase().includes(filterText.toLowerCase()) || 
      d.location.toLowerCase().includes(filterText.toLowerCase())
    );
  }, [drivesList, filterText]);

  const handleReserve = (drive: BloodDrive) => {
    setReservingId(drive.id);
    setTimeout(() => {
      setReservingId(null);
      setConfirmedId(drive.id);
      onNotify?.(`Slot Confirmed: ${drive.title} at ${drive.location}. Appointment token sent to mobile.`, 'success');
      setTimeout(() => setConfirmedId(null), 3000);
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Community Drives</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{filteredDrives.length} Active Facilities Synced</p>
        </div>
        <div className="flex gap-2">
          {user?.role === 'BloodBank' && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 shadow-xl transition-all"
            >
              <PlusCircle className="w-4 h-4" /> Host Camp
            </button>
          )}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-sm">
            <button 
              onClick={() => setViewMode('list')} 
              className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-md border border-slate-100' : 'text-slate-400'}`}
            >
              <LayoutList className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode('map')} 
              className={`p-2 rounded-xl transition-all ${viewMode === 'map' ? 'bg-white text-red-600 shadow-md border border-slate-100' : 'text-slate-400'}`}
            >
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
            placeholder="Search by drive title or region..."
            className="w-full pl-12 pr-6 py-4 rounded-2xl border border-slate-100 bg-white shadow-sm text-sm font-bold focus:ring-4 focus:ring-red-500/10 transition-all"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setViewMode('map')}
          className="px-6 py-4 bg-white border border-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 flex items-center gap-2 shadow-sm"
        >
          <LocateFixed className="w-4 h-4" /> Nearby Mode
        </button>
      </div>
      
      {viewMode === 'map' && initialLocation ? (
        <div className="animate-in zoom-in duration-500">
          <InteractiveMap 
            userLat={initialLocation.latitude} 
            userLng={initialLocation.longitude} 
            drives={filteredDrives} 
            onSelectDrive={handleReserve}
            reservingId={reservingId}
            confirmedId={confirmedId}
          />
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredDrives.map(drive => (
            <div key={drive.id} className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col md:flex-row justify-between gap-8">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] ${drive.date === 'TODAY' ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
                    {drive.date === 'TODAY' ? 'Live Session' : drive.date}
                  </div>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{drive.organizer}</span>
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-2xl group-hover:text-red-600 transition-colors tracking-tight leading-none mb-2">{drive.title}</h3>
                  <p className="text-slate-500 text-xs font-medium leading-relaxed max-w-lg">{drive.description}</p>
                </div>
                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    <MapPin className="w-3.5 h-3.5 text-red-400" /> {drive.location}
                  </div>
                  {initialLocation && (
                    <div className="flex items-center gap-2 text-[11px] font-black text-emerald-600 uppercase tracking-widest">
                      <Activity className="w-3.5 h-3.5" /> {calculateDistance(initialLocation.latitude, initialLocation.longitude, drive.coordinates.lat, drive.coordinates.lng)} KM
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col justify-between items-end gap-6">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map(i => (
                    <img key={i} src={`https://i.pravatar.cc/100?u=${drive.id}-${i}`} className="w-10 h-10 rounded-full border-4 border-white shadow-sm" alt="donor" />
                  ))}
                  <div className="w-10 h-10 rounded-full bg-slate-50 border-4 border-white flex items-center justify-center text-[9px] font-black text-slate-400">+12</div>
                </div>
                
                <button 
                  onClick={() => handleReserve(drive)}
                  disabled={reservingId === drive.id}
                  className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all ${
                    confirmedId === drive.id 
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                    : 'bg-slate-900 text-white hover:bg-red-600 shadow-xl'
                  }`}
                >
                  {reservingId === drive.id ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> SYNCING...</>
                  ) : confirmedId === drive.id ? (
                    <><CheckCircle2 className="w-4 h-4" /> RESERVED</>
                  ) : (
                    <>Reserve Slot <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BloodDriveList;
