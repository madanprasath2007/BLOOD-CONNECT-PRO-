
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
  Activity, 
  X,
  Thermometer,
  Scale,
  Camera,
  BrainCircuit,
  Zap,
  Check,
  AlertCircle,
  Stethoscope,
  Sparkles
} from 'lucide-react';
import { backendService } from '../services/backendService';
import { Donor, BloodType } from '../services/types';
import { GeoCoords } from '../services/locationService';
import { extractLicenseDetails, evaluateCollectionVitals } from '../services/geminiService';
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showReceipt, setShowReceipt] = useState<{ donor: any; id: string; date: string; expiryDate: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    sex: 'Male',
    dob: '',
    phone: '',
    email: '',
    aadhaarNumber: '',
    address: '',
    bloodType: 'O+' as BloodType,
    age: '25',
    hbLevel: 13.5,
    weight: 65,
    bp: '120/80',
    volume: 350
  });

  const [aiResult, setAiResult] = useState<{ volume: number; status: 'OPTIMAL' | 'STABLE' | 'BLOCKED'; reason: string } | null>(null);

  const handleAiCheck = async () => {
    setIsAnalyzing(true);
    try {
      const assessment = await evaluateCollectionVitals({
        hbLevel: formData.hbLevel,
        weight: formData.weight,
        bp: formData.bp,
        age: parseInt(formData.age) || 25,
        sex: formData.sex
      });
      setAiResult(assessment);
      if (assessment.volume > 0) {
        setFormData(prev => ({ ...prev, volume: assessment.volume }));
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

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
          setFormData(prev => ({
            ...prev,
            name: details.full_name || prev.name,
            aadhaarNumber: details.license_number || prev.aadhaarNumber,
            address: details.address || prev.address,
            sex: details.sex || prev.sex,
            dob: details.date_of_birth || prev.dob
          }));
        }
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRecordDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (aiResult?.status === 'BLOCKED') return;
    setIsRecording(true);
    try {
      const result = await backendService.recordDonation(
        selectedDonor?.id || `d-new-${Date.now()}`,
        bankId,
        formData.bloodType,
        formData.volume
      );
      if (result.success && result.bag) {
        setShowReceipt({ donor: formData, id: result.bag.id, date: result.bag.collectionDate, expiryDate: result.bag.expiryDate });
        setSearchTerm('');
        setSelectedDonor(null);
        setAiResult(null);
      }
    } finally {
      setIsRecording(false);
    }
  };

  const labelClass = "text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 flex items-center gap-1.5";
  const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 text-sm focus:ring-4 focus:ring-red-500/10 focus:border-red-600 transition-all outline-none";

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
            <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center shadow-xl shadow-red-900/40">
              <Activity className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tight">Collection Console</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5">Phlebotomy Command • {bankName}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-emerald-500/10 border border-emerald-500/30 px-6 py-4 rounded-2xl">
             <ShieldCheck className="w-5 h-5 text-emerald-400" />
             <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Compliance Verified</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl text-center group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Vision AI Entry</h3>
            {isScanning ? (
              <div className="py-10 flex flex-col items-center gap-4">
                 <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Scanning Aadhaar...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl mx-auto flex items-center justify-center border-2 border-slate-100 group-hover:scale-110 group-hover:bg-red-50 group-hover:border-red-200 transition-all duration-500">
                  <Camera className="w-10 h-10 text-slate-300 group-hover:text-red-500" />
                </div>
                <p className="text-sm font-black text-slate-700 tracking-tight">Sync Aadhaar OCR</p>
              </div>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleIdUpload} />
          </div>

          <button 
            onClick={handleAiCheck}
            disabled={isAnalyzing}
            className="w-full bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl hover:bg-indigo-600 transition-all group flex flex-col items-center gap-4"
          >
             <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-all">
                {isAnalyzing ? <Loader2 className="w-10 h-10 text-white animate-spin" /> : <BrainCircuit className="w-10 h-10 text-indigo-400" />}
             </div>
             <div className="text-center">
                <h4 className="font-black uppercase tracking-widest text-sm">Run AI Clinical Scan</h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Verify vitals via Gemini 3 Pro</p>
             </div>
          </button>
        </div>

        <div className="lg:col-span-8">
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden">
            <div className="bg-slate-900 p-8 text-white flex items-center justify-between">
              <h3 className="text-xl font-black uppercase tracking-tight">Clinical Evaluation Profile</h3>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Node SYNC</span>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              </div>
            </div>

            <form onSubmit={handleRecordDonation} className="p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-1.5">
                  <label className={labelClass}><Thermometer className="w-3 h-3" /> Hb Level</label>
                  <input type="number" step="0.1" className={inputClass} value={formData.hbLevel} onChange={e => setFormData({...formData, hbLevel: parseFloat(e.target.value)})} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}><Scale className="w-3 h-3" /> Weight (KG)</label>
                  <input type="number" className={inputClass} value={formData.weight} onChange={e => setFormData({...formData, weight: parseInt(e.target.value)})} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}><Activity className="w-3 h-3" /> Blood Pressure</label>
                  <input type="text" className={inputClass} value={formData.bp} onChange={e => setFormData({...formData, bp: e.target.value})} placeholder="120/80" />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}><Zap className="w-3 h-3" /> Target Vol</label>
                  <select className={inputClass} value={formData.volume} onChange={e => setFormData({...formData, volume: parseInt(e.target.value)})}>
                    <option value={350}>350 ml</option>
                    <option value={450}>450 ml</option>
                    {aiResult?.volume === 0 && <option value={0}>0 ml (BLOCKED)</option>}
                  </select>
                </div>
              </div>

              {aiResult ? (
                <div className={`p-6 rounded-[2rem] border-2 flex items-center gap-6 animate-in slide-in-from-top-4 transition-all ${aiResult.status === 'BLOCKED' ? 'bg-red-50 border-red-200 shadow-lg shadow-red-100' : aiResult.status === 'OPTIMAL' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-900 text-white shadow-2xl'}`}>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${aiResult.status === 'BLOCKED' ? 'bg-red-600 text-white' : aiResult.status === 'OPTIMAL' ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'}`}>
                    {aiResult.status === 'BLOCKED' ? <AlertCircle className="w-8 h-8" /> : <BrainCircuit className="w-8 h-8 animate-pulse" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                       <h5 className="text-lg font-black uppercase tracking-tight">AI Assessment: {aiResult.status}</h5>
                       <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${aiResult.status === 'BLOCKED' ? 'bg-red-200 text-red-700' : 'bg-white/10 text-white'}`}>Confidence High</span>
                    </div>
                    <p className={`text-[10px] font-bold mt-1 leading-relaxed ${aiResult.status === 'BLOCKED' ? 'text-red-700' : aiResult.status === 'OPTIMAL' ? 'text-emerald-700' : 'text-slate-400'}`}>{aiResult.reason}</p>
                    {aiResult.volume > 0 && (
                      <p className="text-[9px] font-black uppercase tracking-[0.1em] mt-2 opacity-60">Suggested Extraction: {aiResult.volume}ml</p>
                    )}
                  </div>
                  {aiResult.status !== 'BLOCKED' && (
                    <div className="hidden sm:block">
                       <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                       </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center text-center">
                   <Stethoscope className="w-10 h-10 text-slate-200 mb-2" />
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Awaiting AI Clinical assessment</p>
                   <p className="text-[9px] text-slate-300 font-bold mt-1">Press 'Run AI Clinical Scan' to analyze donor vitals</p>
                </div>
              )}

              <button
                type="submit"
                disabled={aiResult?.status === 'BLOCKED' || isRecording || !aiResult}
                className={`w-full py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs transition-all shadow-2xl flex items-center justify-center gap-3 ${!aiResult ? 'bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed' : aiResult.status === 'BLOCKED' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700 shadow-red-200 group'}`}
              >
                {isRecording ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    {aiResult ? <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> : <Sparkles className="w-5 h-5 opacity-40" />}
                    {aiResult ? 'Execute Digital Entry' : 'Verify via AI to Continue'}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BloodCollection;
