
import React, { useState, useEffect } from 'react';
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
  Loader2
} from 'lucide-react';
import { backendService } from '../services/backendService';
import { Donor, BloodType } from '../services/types';
import DonationReceipt from './DonationReceipt';
import { GeoCoords } from '../services/locationService';

interface DonorDatabaseProps {
  userLocation: GeoCoords | null;
}

type SortOption = 'distance' | 'age-asc' | 'age-desc' | 'donation';

const DonorDatabase: React.FC<DonorDatabaseProps> = ({ userLocation }) => {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<BloodType | 'All'>('All');
  const [sortBy, setSortBy] = useState<SortOption>('distance');
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<{ donor: Donor; id: string; date: string; } | null>(null);

  useEffect(() => {
    loadDatabase();
  }, []);

  const loadDatabase = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const data = backendService.getDonors();
      setDonors(data);
      setIsSyncing(false);
    }, 600);
  };

  const deleteDonor = (id: string) => {
    if (window.confirm('Confirm professional removal of this donor from the medical registry?')) {
      backendService.deleteDonor(id);
      setDonors(prev => prev.filter(d => d.id !== id));
    }
  };

  const handleRecordDonation = (donor: Donor) => {
    const receiptId = `BB-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const date = new Date().toLocaleDateString('en-IN');
    
    const updatedDonors = donors.map(d => d.id === donor.id ? { 
      ...d, 
      isAvailable: false, 
      lastDonation: new Date().toISOString().split('T')[0] 
    } : d);
    
    setDonors(updatedDonors);
    
    // Persist specific updated donor back to DB
    const updatedDonor = updatedDonors.find(d => d.id === donor.id);
    if (updatedDonor) {
      const fullDb = backendService.getDonors();
      const newDb = fullDb.map(d => d.id === donor.id ? updatedDonor : d);
      localStorage.setItem('redconnect_donor_db', JSON.stringify(newDb));
    }

    setActiveReceipt({ donor, id: receiptId, date });
  };

  const getProcessedDonors = () => {
    let result = [...donors];

    result = result.filter(d => {
      const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           d.phone.includes(searchTerm);
      const matchesType = selectedType === 'All' || d.bloodType === selectedType;
      return matchesSearch && matchesType;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case 'age-asc': return a.age - b.age;
        case 'age-desc': return b.age - a.age;
        case 'distance': return a.distance - b.distance;
        case 'donation': return new Date(b.lastDonation).getTime() - new Date(a.lastDonation).getTime();
        default: return 0;
      }
    });

    return result;
  };

  const filteredDonors = getProcessedDonors();

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {activeReceipt && (
        <DonationReceipt 
          donor={activeReceipt.donor}
          receiptId={activeReceipt.id}
          date={activeReceipt.date}
          units={350}
          hbLevel={13.5}
          onClose={() => setActiveReceipt(null)}
        />
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Network Donor Registry</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-0.5">Verified Medical Volunteers</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-2xl shadow-sm">
            {isSyncing ? <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" /> : <Database className="w-3.5 h-3.5 text-emerald-600" />}
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
              {isSyncing ? 'Synchronizing...' : 'Med-Cloud Online'}
            </span>
          </div>
          <button onClick={loadDatabase} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-red-600 transition-all shadow-sm">
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/30 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by name, contact, or ID..."
              className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all text-sm font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-4 py-2 rounded-2xl">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select className="bg-transparent text-[10px] font-black text-slate-600 focus:outline-none uppercase tracking-widest" value={selectedType} onChange={(e) => setSelectedType(e.target.value as any)}>
                <option value="All">All Blood Types</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-4 py-2 rounded-2xl">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select className="bg-transparent text-[10px] font-black text-slate-600 focus:outline-none uppercase tracking-widest" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}>
                <option value="distance">Proximity</option>
                <option value="age-asc">Youngest First</option>
                <option value="age-desc">Oldest First</option>
                <option value="donation">Last Donated</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {filteredDonors.length > 0 ? (
          filteredDonors.map((donor) => (
            <div key={donor.id} className="bg-white border border-slate-100 rounded-[2rem] p-6 flex flex-col sm:flex-row items-center justify-between gap-4 hover:border-red-100 hover:shadow-xl transition-all group overflow-hidden relative">
              <div className="flex items-center gap-5 w-full sm:w-auto relative z-10">
                <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black text-xl border-2 ${donor.isAvailable ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                  {donor.bloodType}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-black text-slate-800 text-lg tracking-tight">{donor.name}</h3>
                    <span className="bg-slate-100 text-slate-500 text-[9px] px-2 py-0.5 rounded-lg font-black uppercase tracking-widest">{donor.age} Y/O</span>
                    {donor.idVerified && (
                      <span className="bg-emerald-100 text-emerald-700 text-[8px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest flex items-center gap-1.5 border border-emerald-200 shadow-sm">
                        <ShieldCheck className="w-3 h-3" /> VERIFIED
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <Navigation className="w-3.5 h-3.5" /> {donor.distance} KM
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-slate-300" /> {donor.lastDonation}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto relative z-10">
                {donor.isAvailable ? (
                  <button onClick={() => handleRecordDonation(donor)} className="flex-1 sm:flex-none px-6 py-3.5 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-100 active:scale-95">Record Donation</button>
                ) : (
                   <span className="px-6 py-3.5 bg-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest">Replenishing</span>
                )}
                <a href={`tel:${donor.phone}`} className="p-3.5 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-lg active:scale-95"><Phone className="w-4 h-4" /></a>
                <button onClick={() => deleteDonor(donor.id)} className="p-3.5 bg-slate-50 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-600 border border-slate-100 transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>
              <User className="absolute -bottom-6 -right-6 w-32 h-32 text-slate-50/50 -rotate-12 pointer-events-none" />
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-[3rem] border-4 border-dashed border-slate-50 flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <Search className="w-10 h-10 text-slate-200" />
            </div>
            <h4 className="text-slate-400 font-black uppercase tracking-[0.2em] text-sm">Registry Query: Empty</h4>
            <p className="text-slate-300 font-bold text-xs mt-2">No donors match your current filters within the cloud node.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DonorDatabase;
