
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
  Target
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
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [sortBy, setSortBy] = useState<SortOption>('donation');
  const [isSyncing, setIsSyncing] = useState(false);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<{ donor: Donor; id: string; date: string; expiryDate: string; } | null>(null);
  const [expandedHistoryIds, setExpandedHistoryIds] = useState<Set<string>>(new Set());
  const [trackingId, setTrackingId] = useState<string | null>(null);

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

  const toggleHistory = (id: string) => {
    setExpandedHistoryIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getProcessedDonors = () => {
    let result = [...donors].map(d => {
      let dynamicDistance = d.distance || 0;
      if (userLocation && d.lat && d.lng) {
        dynamicDistance = calculateDistance(userLocation.latitude, userLocation.longitude, d.lat, d.lng);
      }
      return { ...d, distance: dynamicDistance };
    });

    result = result.filter(d => {
      const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.phone.includes(searchTerm);
      const matchesType = selectedType === 'All' || d.bloodType === selectedType;
      return matchesSearch && matchesType;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case 'age-asc': return a.age - b.age;
        case 'age-desc': return b.age - a.age;
        case 'distance': return (a.distance || 0) - (b.distance || 0);
        case 'donation': return new Date(b.lastDonation).getTime() - new Date(a.lastDonation).getTime();
        default: return 0;
      }
    });

    return result;
  };

  const filteredDonors = getProcessedDonors();

  const handleExportFilteredCSV = () => {
    setIsExporting(true);
    setTimeout(() => {
      if (filteredDonors.length === 0) {
        alert("The current filtered view is empty. Nothing to export.");
        setIsExporting(false);
        return;
      }

      const headers = [
        "Donor ID", 
        "Name", 
        "Blood Type", 
        "Age", 
        "Phone", 
        "Last Donation Date", 
        "Last Bag ID", 
        "Last Bag Expiry", 
        "Distance (KM)",
        "Verified Status",
        "Permanent Address"
      ];

      const rows = filteredDonors.map(d => [
        d.id,
        d.name,
        d.bloodType,
        d.age,
        d.phone,
        d.lastDonation,
        d.lastBagId || 'N/A',
        d.lastBagExpiry || 'N/A',
        d.distance || 0,
        d.idVerified ? "VERIFIED" : "PENDING",
        `"${(d.permanentAddress || '').replace(/"/g, '""')}"` 
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map(e => e.join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      
      link.setAttribute("href", url);
      link.setAttribute("download", `RedConnect_Registry_Export_${timestamp}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setIsExporting(false);
    }, 1200);
  };

  const deleteDonor = (id: string) => {
    if (window.confirm('Confirm professional removal of this donor from the medical registry?')) {
      backendService.deleteDonor(id);
      setDonors(prev => prev.filter(d => d.id !== id));
    }
  };

  const handleRecordDonation = async (donor: Donor) => {
    setRecordingId(donor.id);
    try {
      const result = await backendService.recordDonation(donor.id, bankId, donor.bloodType, 350);
      if (result.success && result.bag) {
        setActiveReceipt({ 
          donor, 
          id: result.bag.id, 
          date: new Date().toLocaleDateString('en-IN'), 
          expiryDate: result.bag.expiryDate 
        });
        loadDatabase();
      }
    } catch (err) {
      console.error("Donation recording failed", err);
    } finally {
      setRecordingId(null);
    }
  };

  const openDirections = (donor: Donor) => {
    const origin = userLocation ? `${userLocation.latitude},${userLocation.longitude}` : 'My+Location';
    const destination = encodeURIComponent(donor.permanentAddress || `${donor.name} Blood Donor`);
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`, '_blank');
  };

  const trackLiveLocation = (donor: Donor) => {
    if (!donor.lat || !donor.lng) return;
    setTrackingId(donor.id);
    
    // Simulate tactical signal acquisition
    setTimeout(() => {
      const origin = userLocation ? `${userLocation.latitude},${userLocation.longitude}` : 'My+Location';
      const destination = `${donor.lat},${donor.lng}`;
      window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`, '_blank');
      setTrackingId(null);
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {activeReceipt && (
        <DonationReceipt 
          donor={activeReceipt.donor}
          receiptId={activeReceipt.id}
          date={activeReceipt.date}
          expiryDate={activeReceipt.expiryDate}
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
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportFilteredCSV}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-2xl shadow-xl hover:bg-black transition-all active:scale-95 disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 text-emerald-400" />}
            <span className="text-[10px] font-black uppercase tracking-widest">Export CSV</span>
          </button>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-2xl shadow-sm">
            {isSyncing ? <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" /> : <Database className="w-3.5 h-3.5 text-emerald-600" />}
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
              {isSyncing ? 'Syncing...' : 'Med-Cloud Online'}
            </span>
          </div>
          
          <button onClick={loadDatabase} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-red-600 transition-all shadow-sm">
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/30 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by name, contact, or ID..."
              className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/10 transition-all text-sm font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="md:col-span-3 flex items-center gap-2 bg-slate-50 border border-slate-100 px-4 py-2 rounded-2xl">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select className="bg-transparent text-[10px] font-black text-slate-600 focus:outline-none uppercase tracking-widest w-full" value={selectedType} onChange={(e) => setSelectedType(e.target.value as any)}>
              <option value="All">All Groups</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="md:col-span-3 flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-2 rounded-2xl">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select className="bg-transparent text-[10px] font-black text-slate-600 focus:outline-none uppercase tracking-widest w-full" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}>
              <option value="donation">Sort: Date</option>
              <option value="distance">Sort: GPS</option>
              <option value="age-asc">Sort: Youngest</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {filteredDonors.length > 0 ? (
          filteredDonors.map((donor) => {
            const hasGPS = donor.lat !== undefined && donor.lng !== undefined;
            const isExpanded = expandedHistoryIds.has(donor.id);
            const isTracking = trackingId === donor.id;
            
            return (
              <div key={donor.id} className="bg-white border border-slate-100 rounded-[2rem] p-6 flex flex-col items-stretch gap-4 hover:border-red-100 hover:shadow-xl transition-all group overflow-hidden relative">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-5 w-full sm:w-auto relative z-10">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl border-2 ${donor.isAvailable ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                      {donor.bloodType}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-black text-slate-800 text-lg tracking-tight">{donor.name}</h3>
                        <span className="bg-slate-100 text-slate-500 text-[9px] px-2 py-0.5 rounded-lg font-black uppercase tracking-widest">{donor.age} Y/O</span>
                        {donor.idVerified && (
                          <span className="bg-emerald-100 text-emerald-700 text-[8px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest flex items-center gap-1.5 border border-emerald-200">
                            <ShieldCheck className="w-3 h-3" /> VERIFIED
                          </span>
                        )}
                        {donor.isAvailable && hasGPS && (
                          <div className="flex items-center gap-2 bg-red-50 text-red-600 px-2 py-0.5 rounded-lg border border-red-100 shadow-sm animate-pulse">
                            <Wifi className="w-3 h-3" />
                            <span className="text-[8px] font-black uppercase tracking-widest">LIVE SIGNAL</span>
                            <div className="flex gap-0.5">
                              <div className="w-0.5 h-2 bg-red-600 rounded-full"></div>
                              <div className="w-0.5 h-2 bg-red-600 rounded-full"></div>
                              <div className="w-0.5 h-2 bg-red-300 rounded-full"></div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <div className="flex items-center gap-1.5 text-emerald-600">
                          <MapPinned className="w-3.5 h-3.5" /> {donor.distance || 0} KM FROM GPS
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-300" /> 
                          {donor.isAvailable ? (
                            <span>Available • Last: {donor.lastDonation}</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-red-600 font-black">BAG: {donor.lastBagId || 'N/A'}</span>
                              <span className="text-slate-300">|</span>
                              <span className="text-red-500">EXP: {donor.lastBagExpiry || 'N/A'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto relative z-10 flex-wrap justify-end">
                    <button 
                      onClick={() => toggleHistory(donor.id)}
                      className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${isExpanded ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      <HeartPulse className="w-4 h-4" />
                      {isExpanded ? 'Hide History' : 'Health History'}
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {donor.isAvailable ? (
                      <div className="flex flex-1 sm:flex-none gap-2">
                        <button 
                          onClick={() => handleRecordDonation(donor)} 
                          disabled={recordingId === donor.id}
                          className="flex-1 sm:flex-none px-6 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-50"
                        >
                          {recordingId === donor.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Record Donation'}
                        </button>
                        
                        {hasGPS && (
                          <button 
                            onClick={() => trackLiveLocation(donor)}
                            disabled={isTracking}
                            className={`flex items-center gap-2 px-6 py-3.5 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 group relative overflow-hidden ${isTracking ? 'bg-indigo-600' : 'bg-red-600 hover:bg-red-700 shadow-red-200'}`}
                          >
                            {isTracking ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Signal Lock...</span>
                              </>
                            ) : (
                              <>
                                <div className="absolute inset-0 bg-red-400 opacity-0 group-hover:opacity-20 animate-pulse"></div>
                                <Radar className="w-4 h-4 animate-spin-slow" />
                                <span className="hidden lg:inline">Track Live Location</span>
                                <span className="lg:hidden">Track</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="px-10 py-3.5 bg-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest">In Recovery</span>
                    )}
                    
                    <div className="flex gap-2">
                      <a href={`tel:${donor.phone}`} className="p-3.5 bg-slate-50 text-slate-500 border border-slate-200 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-95"><Phone className="w-4 h-4" /></a>
                      <button onClick={() => openDirections(donor)} className="p-3.5 bg-slate-50 text-slate-500 border border-slate-200 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95"><Navigation className="w-4 h-4" /></button>
                    </div>
                    <button onClick={() => deleteDonor(donor.id)} className="p-3.5 bg-slate-50 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-600 border border-slate-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-200 animate-in slide-in-from-top-2 duration-300 relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-4">
                      <Stethoscope className="w-5 h-5 text-indigo-600" />
                      <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Clinical Health History</h4>
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-6 relative z-10">
                      <div className="space-y-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Self-Reported Medical History</p>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 text-xs font-medium text-slate-700 leading-relaxed shadow-sm min-h-[60px]">
                          {donor.medicalHistory || "No documented pre-existing conditions or medical constraints reported in latest screening."}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Latest Professional Screening</p>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                              <Calendar className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-800 uppercase">Screening Date</p>
                              <p className="text-xs font-bold text-slate-500">{donor.lastHealthCheck || donor.lastDonation || "Awaiting physical evaluation"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            <span className="text-[8px] font-black text-emerald-700 uppercase">Cleared</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <HeartPulse className="absolute -bottom-6 -right-6 w-32 h-32 text-slate-200/50 -rotate-12 pointer-events-none" />
                  </div>
                )}
                
                <User className="absolute -bottom-6 -right-6 w-32 h-32 text-slate-50/50 -rotate-12 pointer-events-none" />
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 bg-white rounded-[3rem] border-4 border-dashed border-slate-50 flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <Search className="w-10 h-10 text-slate-200" />
            </div>
            <h4 className="text-slate-400 font-black uppercase tracking-[0.2em] text-sm">Registry Filter Clear</h4>
          </div>
        )}
      </div>
    </div>
  );
};

export default DonorDatabase;
