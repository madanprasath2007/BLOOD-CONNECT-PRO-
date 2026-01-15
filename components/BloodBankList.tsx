
import React, { useState } from 'react';
import { Landmark, MapPin, Phone, Info, ChevronRight, Droplet, Search, ShieldCheck, Navigation, Loader2, ExternalLink, Radar, SlidersHorizontal, Map as MapIcon, LayoutList } from 'lucide-react';
import { MOCK_BANKS } from '../constants';
import { BloodType } from '../services/types';
import { findNearbyBanks } from '../services/geminiService';
import { GeoCoords, getCurrentPosition, calculateDistance } from '../services/locationService';
import InteractiveMap from './InteractiveMap';

interface BloodBankListProps {
  currentUserBank?: string;
  initialLocation: GeoCoords | null;
}

const BloodBankList: React.FC<BloodBankListProps> = ({ currentUserBank, initialLocation }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [realBanks, setRealBanks] = useState<any[]>([]);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchRadius, setSearchRadius] = useState<20 | 50>(20);
  const [currentCoords, setCurrentCoords] = useState<GeoCoords | null>(initialLocation);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const handleNearbySearch = async () => {
    setIsLocating(true);
    setLocationError(null);
    try {
      const coords = await getCurrentPosition();
      setCurrentCoords(coords);
      const results = await findNearbyBanks(coords.latitude, coords.longitude, searchRadius);
      setRealBanks(results.chunks);
      setViewMode('map');
      if (results.chunks.length === 0) {
        setLocationError(`No verified centers found within ${searchRadius}km range.`);
      }
    } catch (err: any) {
      setLocationError(err.message || "Failed to fetch nearby banks.");
    } finally {
      setIsLocating(false);
    }
  };

  const openDirections = (lat: number, lng: number) => {
    if (!currentCoords) return;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${currentCoords.latitude},${currentCoords.longitude}&destination=${lat},${lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const filteredBanks = MOCK_BANKS.filter(bank => 
    bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bank.location.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text"
              placeholder="Search registries..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-100 bg-white shadow-sm text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={handleNearbySearch}
            disabled={isLocating}
            className={`px-8 py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-3 transition-all shadow-xl ${isLocating ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-slate-900 text-white shadow-slate-200'}`}
          >
            {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radar className="w-4 h-4" />}
            {isLocating ? 'SCANNING...' : 'GPS LIVE SCAN'}
          </button>
        </div>

        <div className="flex items-center justify-between px-2 bg-slate-50/50 p-2 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Radius:</span>
            <button onClick={() => setSearchRadius(20)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black ${searchRadius === 20 ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}>20 KM</button>
            <button onClick={() => setSearchRadius(50)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black ${searchRadius === 50 ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}>50 KM</button>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400'}`}><LayoutList className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('map')} className={`p-1.5 rounded-lg ${viewMode === 'map' ? 'bg-white text-red-600 shadow-sm border border-slate-200' : 'text-slate-400'}`}><MapIcon className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {viewMode === 'map' && currentCoords ? (
        <InteractiveMap userLat={currentCoords.latitude} userLng={currentCoords.longitude} banks={MOCK_BANKS} />
      ) : (
        <div className="grid gap-4">
          {filteredBanks.map((bank) => (
            <div key={bank.id} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-5">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-red-600 border border-slate-100"><Landmark className="w-7 h-7" /></div>
                  <div>
                    <h3 className="font-black text-slate-800 text-xl tracking-tight leading-tight">{bank.name}</h3>
                    <div className="flex items-center gap-1 text-slate-500 text-xs font-bold mt-1">
                      <MapPin className="w-3.5 h-3.5 text-red-400" /> <span>{bank.location.address}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => openDirections(bank.location.lat, bank.location.lng)}
                  className="p-3 bg-slate-900 text-white rounded-xl hover:bg-red-600 transition-all shadow-lg"
                  title="Get Directions"
                >
                  <Navigation className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2 pt-2">
                {(Object.keys(bank.inventory) as BloodType[]).map((type) => (
                  <div key={type} className="px-4 py-2 rounded-xl border bg-slate-50 border-slate-100 text-xs font-black text-slate-700 uppercase tracking-widest hover:bg-red-50 hover:border-red-100 transition-colors cursor-default">
                    {type}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BloodBankList;
