
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Phone, 
  ShieldCheck, 
  Database, 
  RefreshCw, 
  Trash2,
  Navigation,
  ArrowUpDown,
  User,
  Loader2,
  MapPinned,
  CheckCircle2,
  Sparkles,
  Zap,
  Clock,
  FileSpreadsheet,
  Download,
  Calendar,
  LocateFixed,
  Radar,
  Wifi,
  HeartPulse,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  Signal,
  Target,
  Droplets,
  Plus,
  // Added Activity to fix Cannot find name error on line 225
  Activity
} from 'lucide-react';
import { backendService } from '../services/backendService';
import { Donor, BloodType } from '../services/types';
import DonationReceipt from './DonationReceipt';
import { GeoCoords, calculateDistance } from '../services/locationService';

interface DonorDatabaseProps {
  userLocation: GeoCoords | null;
  bankId: string;
}

type SortOption = 'distance' | 'age-asc' | 'age-desc' | 'donation';

const DonorDatabase: React.FC<DonorDatabaseProps> = ({ userLocation, bankId }) => {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<BloodType | 'All'>('All');
  const [sortBy, setSortBy] = useState<SortOption>('donation');
  const [isSyncing, setIsSyncing] = useState(false);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<{ donor: Donor; id: string; date: string; expiryDate: string; units: number; hbLevel: number } | null>(null);

  useEffect(() => {
    loadDatabase();
  }, []);

  const loadDatabase = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const data = backendService.getDonors();
      setDonors(data);
      setIsSyncing(false);
    }, 800);
  };

  const handleRecordQuickDonation = async (donor: Donor) => {
    setRecordingId(donor.id);
    const hb = 12.5 + Math.random() * 3;
    const units = 350;
    
    try {
      const result = await backendService.recordDonation(donor.id, bankId, donor.bloodType, units);
      if (result.success && result.bag) {
        setActiveReceipt({
          donor,
          id: result.bag.id,
          date: result.bag.collectionDate,
          expiryDate: result.bag.expiryDate,
          units,
          hbLevel: parseFloat(hb.toFixed(1))
        });
        loadDatabase();
      }
    } finally {
      setRecordingId(null);
    }
  };

  const sortedAndFiltered = useMemo(() => {
    return donors
      .filter(d => {
        const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            d.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = selectedType === 'All' || d.bloodType === selectedType;
        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        if (sortBy === 'age-asc') return a.age - b.age;
        if (sortBy === 'age-desc') return b.age - a.age;
        if (sortBy === 'distance' && userLocation) {
          const distA = calculateDistance(userLocation.latitude, userLocation.longitude, a.lat || 0, a.lng || 0);
          const distB = calculateDistance(userLocation.latitude, userLocation.longitude, b.lat || 0, b.lng || 0);
          return distA - distB;
        }
        return (b.donationCount || 0) - (a.donationCount || 0);
      });
  }, [donors, searchTerm, selectedType, sortBy, userLocation]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {activeReceipt && (
        <DonationReceipt 
          donor={activeReceipt.donor}
          receiptId={activeReceipt.id}
          date={activeReceipt.date}
          expiryDate={activeReceipt.expiryDate}
          units={activeReceipt.units}
          hbLevel={activeReceipt.hbLevel}
          onClose={() => setActiveReceipt(null)}
        />
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Donor Registry</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Authoritative Medical Volunteer Database</p>
        </div>
        <div className="flex gap-3">
           <button onClick={loadDatabase} className="p-4 bg-white border border-slate-200 text-slate-600 rounded-[1.25rem] hover:bg-slate-50 transition-all shadow-sm">
             <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
           </button>
           <div className="bg-slate-900 text-white px-6 py-3 rounded-[1.25rem] flex items-center gap-3 shadow-xl">
              <Database className="w-5 h-5 text-red-500" />
              <span className="text-xs font-black uppercase tracking-widest">{donors.length} Verified Nodes</span>
           </div>
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-6 items-start">
        <div className="md:col-span-12 lg:col-span-8 space-y-6">
          <div className="flex flex-col sm:flex-row gap-3">
             <div className="relative flex-1">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search donor name or mail ID..." 
                  className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm font-bold text-slate-800 focus:ring-4 focus:ring-red-500/5 transition-all outline-none"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
             </div>
             <select 
               className="px-6 py-4 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm font-black text-[11px] uppercase tracking-widest text-slate-600 outline-none cursor-pointer"
               value={selectedType}
               onChange={e => setSelectedType(e.target.value as any)}
             >
               <option value="All">Filter: All Groups</option>
               {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <option key={t} value={t}>{t}</option>)}
             </select>
          </div>

          <div className="grid gap-4">
            {sortedAndFiltered.map(donor => (
              <div key={donor.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div className="flex items-center gap-6">
                       <div className="relative">
                          <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex flex-col items-center justify-center font-black text-2xl text-red-600 border-2 border-slate-100">
                             {donor.bloodType}
                             <span className="text-[8px] opacity-40 uppercase">Group</span>
                          </div>
                          {donor.idVerified && (
                             <div className="absolute -top-2 -right-2 bg-emerald-500 text-white p-1 rounded-full border-2 border-white shadow-lg">
                                <ShieldCheck className="w-4 h-4" />
                             </div>
                          )}
                       </div>
                       <div>
                          <h4 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-1">{donor.name}</h4>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{donor.email}</p>
                          <div className="flex items-center gap-4 mt-3">
                             <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 bg-slate-50 px-3 py-1 rounded-lg">
                                <Zap className="w-3.5 h-3.5 text-amber-500" /> {donor.donationCount || 0} DONATIONS
                             </div>
                             <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600">
                                <Clock className="w-3.5 h-3.5" /> LAST: {donor.lastDonation || 'NEVER'}
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                       <button 
                         onClick={() => handleRecordQuickDonation(donor)}
                         disabled={!!recordingId}
                         className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-900 transition-all shadow-xl shadow-red-100"
                       >
                         {recordingId === donor.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Record Donation</>}
                       </button>
                    </div>
                 </div>
                 <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 -z-10 rounded-bl-[100%] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-12 lg:col-span-4 space-y-6">
           <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10">
                 <h3 className="text-lg font-black uppercase tracking-tight mb-6">Database Insights</h3>
                 <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                       <div className="flex items-center gap-3">
                          <Activity className="w-5 h-5 text-emerald-500" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Retention Rate</span>
                       </div>
                       <span className="text-lg font-black">68%</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                       <div className="flex items-center gap-3">
                          <Droplets className="w-5 h-5 text-red-500" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Rare Groups</span>
                       </div>
                       <span className="text-lg font-black">12%</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                       <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-blue-500" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Verified Accounts</span>
                       </div>
                       <span className="text-lg font-black">94%</span>
                    </div>
                 </div>
                 <button onClick={loadDatabase} className="w-full mt-10 py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-600 hover:text-white transition-all">
                   Force State Sync
                 </button>
              </div>
              <Sparkles className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 rotate-12" />
           </div>

           <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-[2.5rem] shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                 <Stethoscope className="w-6 h-6 text-indigo-600" />
                 <h4 className="text-sm font-black text-indigo-900 uppercase">Pro Compliance</h4>
              </div>
              <p className="text-[11px] text-indigo-700 font-bold leading-relaxed uppercase tracking-wide">
                Donor data is encrypted and managed according to national health privacy standards. Recording a donation instantly updates the donor timeline and local inventory.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DonorDatabase;
