
import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Droplets, 
  User, 
  Phone, 
  CheckCircle2, 
  ShieldCheck, 
  Loader2, 
  Plus, 
  Clock, 
  AlertCircle,
  Hash,
  Activity,
  Award,
  ChevronRight,
  X,
  Thermometer,
  Scale,
  Camera,
  Mail,
  MapPin,
  Calendar,
  Users,
  BrainCircuit,
  Zap,
  Check
} from 'lucide-react';
import { backendService } from '../services/backendService';
import { Donor, BloodType } from '../services/types';
import { GeoCoords, calculateDistance } from '../services/locationService';
import { extractLicenseDetails } from '../services/geminiService';
import DonationReceipt from './DonationReceipt';

interface BloodCollectionProps {
  bankId: string;
  bankName: string;
  userLocation: GeoCoords | null;
}

const BloodCollection: React.FC<BloodCollectionProps> = ({ bankId, bankName, userLocation }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [donors, setDonors] = useState<Donor[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showReceipt, setShowReceipt] = useState<{ donor: any; id: string; date: string; expiryDate: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Expanded Form State
  const [formData, setFormData] = useState({
    name: '',
    sex: 'Male',
    dob: '',
    phone: '',
    email: '',
    aadhaarNumber: '',
    address: '',
    bloodType: 'O+' as BloodType,
    age: '',
    hbLevel: 13.5,
    weight: 65,
    bp: '120/80',
    volume: 350
  });

  // Clinical Validation Logic
  const isHbUnsafe = formData.hbLevel < 12.5;
  const isWeightUnsafe = formData.weight < 45;
  
  // BP Parsing & Validation Logic
  const parseBp = (bpStr: string) => {
    const parts = bpStr.split('/');
    const systolic = parseInt(parts[0]) || 0;
    const diastolic = parseInt(parts[1]) || 0;
    return { systolic, diastolic };
  };
  const { systolic, diastolic } = parseBp(formData.bp);
  const isBpUnsafe = systolic < 100 || systolic > 160 || diastolic < 60 || diastolic > 100;

  // AI volume recommendation engine
  const getAiRecommendation = () => {
    if (isHbUnsafe || isWeightUnsafe || isBpUnsafe) {
      return { 
        volume: 0, 
        status: 'CRITICAL', 
        reason: "Clinical criteria for safe donation not met. Process aborted." 
      };
    }
    
    // Advanced Logic: High capacity donor check
    if (formData.weight >= 60 && formData.hbLevel >= 13.5 && systolic <= 140 && diastolic <= 90) {
      return { 
        volume: 450, 
        status: 'OPTIMAL', 
        reason: "Donor vitals are robust. 450ml allocated to maximize supply chain efficiency." 
      };
    }
    
    // Safety restriction for lower body mass
    if (formData.weight < 50) {
      return { 
        volume: 350, 
        status: 'CAUTION', 
        reason: "Low BMI detected. Restricting to 350ml to ensure donor post-donation recovery." 
      };
    }

    return { 
      volume: 350, 
      status: 'STABLE', 
      reason: "Donor vitals within standard range. 350ml baseline allocated." 
    };
  };

  const recommendation = getAiRecommendation();

  useEffect(() => {
    if (searchTerm.length > 2) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        const results = backendService.getDonors().filter(d => 
          d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          d.phone.includes(searchTerm)
        );
        setDonors(results);
        setIsSearching(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setDonors([]);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (selectedDonor) {
      setFormData(prev => ({
        ...prev,
        name: selectedDonor.name,
        bloodType: selectedDonor.bloodType,
        phone: selectedDonor.phone,
        email: selectedDonor.email || '',
        address: selectedDonor.permanentAddress || '',
        age: selectedDonor.age.toString(),
        aadhaarNumber: selectedDonor.idNumber || '',
      }));
    }
  }, [selectedDonor]);

  const handleIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setIsScanning(true);
      try {
        const details = await extractLicenseDetails(base64);
        if (details) {
          let calculatedAge = formData.age;
          if (details.date_of_birth) {
            const birthDate = new Date(details.date_of_birth);
            const today = new Date();
            calculatedAge = (today.getFullYear() - birthDate.getFullYear()).toString();
          }

          setFormData(prev => ({
            ...prev,
            name: details.full_name || prev.name,
            sex: details.sex || prev.sex,
            dob: details.date_of_birth || prev.dob,
            aadhaarNumber: details.license_number || prev.aadhaarNumber,
            address: details.address || prev.address,
            age: calculatedAge
          }));
        }
      } catch (err) {
        console.error("Verification failed", err);
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRecordDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (recommendation.volume === 0) return;
    setIsRecording(true);
    try {
      let donorId = selectedDonor?.id;
      if (!donorId) {
        const newDonor: Donor = {
          id: `d-gen-${Date.now()}`,
          name: formData.name,
          age: parseInt(formData.age) || 0,
          bloodType: formData.bloodType,
          lastDonation: new Date().toISOString().split('T')[0],
          phone: formData.phone,
          isAvailable: false,
          idVerified: true,
          email: formData.email,
          permanentAddress: formData.address,
          idNumber: formData.aadhaarNumber,
          createdAt: new Date().toISOString(),
          donationCount: 0,
          unitsDonatedYear: 0,
          lat: userLocation?.latitude,
          lng: userLocation?.longitude
        };
        backendService.saveDonor(newDonor);
        donorId = newDonor.id;
      }
      
      const result = await backendService.recordDonation(
        donorId, 
        bankId, 
        formData.bloodType, 
        formData.volume,
        formData.sex
      );
      
      if (result.success && result.bag) {
        setShowReceipt({ 
          donor: { 
            name: formData.name, 
            bloodType: formData.bloodType, 
            id: donorId 
          }, 
          id: result.bag.id,
          date: new Date().toLocaleDateString('en-IN'),
          expiryDate: result.bag.expiryDate
        });
        setSelectedDonor(null);
        setSearchTerm('');
      }
    } catch (err) {
      console.error("Donation recording failed", err);
    } finally {
      setIsRecording(false);
    }
  };

  const inputClass = "w-full px-4 py-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-bold text-slate-900 text-sm focus:ring-4 focus:ring-red-500/10 focus:border-red-600 focus:bg-white transition-all outline-none placeholder:text-slate-400";
  const labelClass = "text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 flex items-center gap-1.5";

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {showReceipt && (
        <DonationReceipt 
          donor={showReceipt.donor}
          receiptId={showReceipt.id}
          date={showReceipt.date}
          expiryDate={showReceipt.expiryDate}
          units={formData.volume}
          hbLevel={formData.hbLevel}
          onClose={() => setShowReceipt(null)}
        />
      )}

      <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-red-600 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-red-900/40">
              <Droplets className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight uppercase">Blood Collection</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5">Phlebotomy Operations Node: {bankName}</p>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-2xl backdrop-blur-md">
             <div className="flex items-center gap-2 mb-1">
               <ShieldCheck className="w-4 h-4 text-emerald-400" />
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Compliance Standard</span>
             </div>
             <p className="text-xs font-bold text-white">WHO Safe Collection v4.2</p>
          </div>
        </div>
        <Droplets className="absolute -bottom-10 -left-10 w-64 h-64 text-white/5 rotate-45" />
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 mb-4">Registry Query</h3>
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text"
                placeholder="Search by name or mobile..."
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-300 rounded-3xl font-bold text-slate-900 text-sm focus:ring-4 focus:ring-red-500/10 focus:border-red-600 focus:bg-white transition-all outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="mt-6 space-y-2 max-h-[300px] overflow-y-auto scrollbar-hide">
              {isSearching ? (
                <div className="py-10 flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-3" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Querying Cloud...</span>
                </div>
              ) : donors.length > 0 ? (
                donors.map(donor => (
                  <button
                    key={donor.id}
                    onClick={() => setSelectedDonor(donor)}
                    className={`w-full p-4 rounded-3xl border-2 transition-all flex items-center justify-between text-left group ${
                      selectedDonor?.id === donor.id 
                      ? 'bg-slate-900 border-slate-900 text-white shadow-2xl scale-[1.02]' 
                      : 'bg-white border-slate-50 hover:border-red-100 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border ${
                        selectedDonor?.id === donor.id ? 'bg-white/10 border-white/20' : 'bg-red-50 border-red-100 text-red-600'
                      }`}>
                        {donor.bloodType}
                      </div>
                      <div>
                        <h4 className="font-black text-xs uppercase tracking-tight">{donor.name}</h4>
                        <p className="text-[8px] font-bold uppercase opacity-60 mt-0.5">{donor.phone}</p>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="py-10 text-center text-slate-300">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Select from Registry</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 text-center group">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Credential AI</h3>
            <div className="relative w-full aspect-[1.6/1] bg-slate-50 border-2 border-dashed border-slate-300 rounded-[2rem] flex flex-col items-center justify-center gap-4 group-hover:bg-slate-100 group-hover:border-red-400 transition-all cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {isScanning ? (
                <div className="flex flex-col items-center gap-3">
                   <Activity className="w-10 h-10 text-red-600 animate-spin" />
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Extraction...</span>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 bg-white rounded-3 shadow-lg flex items-center justify-center text-slate-300 group-hover:text-red-500 group-hover:scale-110 transition-all">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-700 tracking-tight">Scan Aadhaar</p>
                  </div>
                </>
              )}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleIdUpload} />
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-slate-900 p-8 text-white flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center font-black text-2xl border-2 border-white/20">
                    {formData.bloodType}
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight">{formData.name || 'New Clinical Entry'}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Safe Collection Relay Node</p>
                  </div>
               </div>
               {selectedDonor && (
                 <button onClick={() => setSelectedDonor(null)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X className="w-6 h-6" /></button>
               )}
            </div>

            <form onSubmit={handleRecordDonation} className="p-10 space-y-10">
              <div className="space-y-6">
                <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                  <User className="w-4 h-4" /> Personal Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Name</label>
                    <input type="text" required placeholder="Legal Name" className={inputClass} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Aadhaar</label>
                    <input type="text" required placeholder="#### #### ####" className={inputClass} value={formData.aadhaarNumber} onChange={e => setFormData({...formData, aadhaarNumber: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Blood Type</label>
                    <select className={inputClass} value={formData.bloodType} onChange={e => setFormData({...formData, bloodType: e.target.value as BloodType})}>
                       {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Clinical Vitals Section - Unified Visual indicators */}
              <div className="space-y-6 pt-6 border-t border-slate-100">
                <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Clinical Vitals Assessment
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* HB Level */}
                  <div className="space-y-1.5">
                    <label className={labelClass}><Thermometer className="w-3 h-3" /> Hb Level (g/dL)</label>
                    <div className="relative group">
                      <input 
                        type="number" 
                        step="0.1" 
                        className={`${inputClass} ${isHbUnsafe ? 'border-red-500 bg-red-50 text-red-900' : 'border-emerald-200 bg-emerald-50/20'}`} 
                        value={formData.hbLevel} 
                        onChange={e => setFormData({...formData, hbLevel: parseFloat(e.target.value) || 0})} 
                      />
                      <div className={`absolute -bottom-1 left-0 h-1 rounded-full transition-all duration-500 ${isHbUnsafe ? 'bg-red-500 w-full' : 'bg-emerald-500 w-full'}`}></div>
                    </div>
                    <p className={`text-[8px] font-black uppercase mt-1.5 ${isHbUnsafe ? 'text-red-500' : 'text-emerald-600'}`}>
                      {isHbUnsafe ? 'CRITICAL (LOW)' : 'OPTIMAL'}
                    </p>
                  </div>

                  {/* Weight */}
                  <div className="space-y-1.5">
                    <label className={labelClass}><Scale className="w-3 h-3" /> Weight (KG)</label>
                    <div className="relative group">
                      <input 
                        type="number" 
                        className={`${inputClass} ${isWeightUnsafe ? 'border-red-500 bg-red-50 text-red-900' : 'border-emerald-200 bg-emerald-50/20'}`} 
                        value={formData.weight} 
                        onChange={e => setFormData({...formData, weight: parseInt(e.target.value) || 0})} 
                      />
                      <div className={`absolute -bottom-1 left-0 h-1 rounded-full transition-all duration-500 ${isWeightUnsafe ? 'bg-red-500 w-full' : 'bg-emerald-500 w-full'}`}></div>
                    </div>
                    <p className={`text-[8px] font-black uppercase mt-1.5 ${isWeightUnsafe ? 'text-red-500' : 'text-emerald-600'}`}>
                      {isWeightUnsafe ? 'UNDERWEIGHT' : 'NORMAL'}
                    </p>
                  </div>

                  {/* BP */}
                  <div className="space-y-1.5">
                    <label className={labelClass}><Activity className="w-3 h-3" /> BP (Sys/Dia)</label>
                    <div className="relative group">
                      <input 
                        type="text" 
                        placeholder="120/80" 
                        className={`${inputClass} ${isBpUnsafe ? 'border-red-500 bg-red-50 text-red-900' : 'border-emerald-200 bg-emerald-50/20'}`} 
                        value={formData.bp} 
                        onChange={e => setFormData({...formData, bp: e.target.value})} 
                      />
                      <div className={`absolute -bottom-1 left-0 h-1 rounded-full transition-all duration-500 ${isBpUnsafe ? 'bg-red-500 w-full' : 'bg-emerald-500 w-full'}`}></div>
                    </div>
                    <p className={`text-[8px] font-black uppercase mt-1.5 ${isBpUnsafe ? 'text-red-500' : 'text-emerald-600'}`}>
                      {isBpUnsafe ? 'OUTSIDE RANGE' : 'STABLE'}
                    </p>
                  </div>

                  {/* Volume Allocation */}
                  <div className="space-y-1.5">
                    <label className={labelClass}><Hash className="w-3 h-3" /> Allocated (ml)</label>
                    <div className="relative group">
                      <select 
                        className={`${inputClass} bg-slate-100 border-slate-200 focus:ring-slate-500/10 focus:border-slate-400`} 
                        value={formData.volume} 
                        onChange={e => setFormData({...formData, volume: parseInt(e.target.value)})}
                      >
                        <option value={350}>350 ml</option>
                        <option value={450}>450 ml</option>
                        {recommendation.volume === 0 && <option value={0}>0 ml (ABORT)</option>}
                      </select>
                      <div className="absolute -bottom-1 left-0 h-1 rounded-full w-full bg-slate-400"></div>
                    </div>
                    <p className="text-[8px] font-black text-slate-400 uppercase mt-1.5">
                      {formData.volume === recommendation.volume ? 'AI SYNCED' : 'MANUAL OVERRIDE'}
                    </p>
                  </div>
                </div>

                {/* AI Allocation HUD */}
                <div className={`p-6 rounded-[2.5rem] border-2 transition-all duration-500 flex flex-col md:flex-row items-center gap-6 ${recommendation.volume === 0 ? 'bg-red-50 border-red-200' : 'bg-slate-900 border-slate-800 shadow-2xl'}`}>
                  <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-lg ${recommendation.volume === 0 ? 'bg-red-600 text-white' : 'bg-indigo-600 text-white'}`}>
                    <BrainCircuit className={`w-9 h-9 ${recommendation.volume > 0 ? 'animate-pulse' : ''}`} />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                      <Zap className={`w-3 h-3 ${recommendation.volume === 0 ? 'text-red-600' : 'text-amber-400'}`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${recommendation.volume === 0 ? 'text-red-700' : 'text-slate-400'}`}>Clinical Intelligence Engine</span>
                    </div>
                    <h5 className={`text-lg font-black uppercase tracking-tight ${recommendation.volume === 0 ? 'text-red-900' : 'text-white'}`}>
                      {recommendation.volume === 0 ? 'Safe Collection Aborted' : `Recommended Volume: ${recommendation.volume}ml`}
                    </h5>
                    <p className={`text-[11px] font-bold mt-1 ${recommendation.volume === 0 ? 'text-red-600' : 'text-slate-400'}`}>
                      {recommendation.reason}
                    </p>
                  </div>
                  {recommendation.volume > 0 && formData.volume !== recommendation.volume && (
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, volume: recommendation.volume})}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                    >
                      Sync AI Recommended
                    </button>
                  )}
                  {recommendation.volume > 0 && formData.volume === recommendation.volume && (
                    <div className="px-6 py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center gap-2">
                       <Check className="w-4 h-4" />
                       <span className="text-[9px] font-black uppercase tracking-widest">Protocol Locked</span>
                    </div>
                  )}
                </div>

                {(isHbUnsafe || isWeightUnsafe || isBpUnsafe) && (
                  <div className="p-5 bg-red-50 border-2 border-red-200 rounded-[2rem] flex items-center gap-4 text-red-600 animate-in slide-in-from-top-2">
                    <div className="w-12 h-12 bg-red-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                      <AlertCircle className="w-7 h-7" />
                    </div>
                    <div>
                      <h5 className="text-[11px] font-black uppercase tracking-widest">Phlebotomy Interlock Active</h5>
                      <p className="text-[10px] font-bold opacity-80 mt-1">
                        Critical vitals detected. Collection is medically restricted for donor safety.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-10 flex gap-4">
                <button
                  type="submit"
                  disabled={isRecording || recommendation.volume === 0 || !formData.name || !formData.aadhaarNumber}
                  className={`flex-1 py-6 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-xs transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-95 group ${recommendation.volume === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-red-600 text-white hover:bg-red-700 shadow-red-200'}`}
                >
                  {isRecording ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Plus className="w-6 h-6 group-hover:scale-125 transition-transform" /> Finalize Collection</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BloodCollection;
