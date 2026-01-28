
import React, { useState, useRef, useEffect } from 'react';
import { UserPlus, User, Mail, Droplets, Phone, MapPin, ShieldCheck, Activity, Lock, AlertCircle, Camera, Trash2, ArrowRight, ChevronRight, KeyRound, Loader2, RefreshCw, Eye, EyeOff, CheckCircle2, Calendar } from 'lucide-react';
import { BloodType } from '../services/types';
import { extractLicenseDetails } from '../services/geminiService';
import { backendService } from '../services/backendService';
import { getCurrentPosition } from '../services/locationService';

interface DonorRegistrationFormProps {
  onRegister: (donorData: any) => void;
}

const DonorRegistrationForm: React.FC<DonorRegistrationFormProps> = ({ onRegister }) => {
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [showKey, setShowKey] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    email: '',
    password: '',
    confirmPassword: '',
    bloodType: 'O+' as BloodType,
    phone: '',
    permanentAddress: '',
    medicalIssues: '',
    idNumber: '',
    isAvailable: true,
    profilePicture: '',
    lat: undefined as number | undefined,
    lng: undefined as number | undefined
  });

  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idVerified, setIdVerified] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let timer: number;
    if (cooldown > 0) timer = window.setInterval(() => setCooldown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    getCurrentPosition().then(coords => {
      setFormData(prev => ({ ...prev, lat: coords.latitude, lng: coords.longitude }));
    }).catch(() => {
      console.warn("Could not capture registration coordinates automatically.");
    });
  }, []);

  const calculateAge = (dobStr: string): string => {
    if (!dobStr) return "";
    let birthDate: Date;
    
    // Try parsing DD/MM/YYYY
    if (dobStr.includes('/')) {
      const parts = dobStr.split('/');
      if (parts.length === 3) {
        const d = parseInt(parts[0]);
        const m = parseInt(parts[1]);
        const y = parseInt(parts[2]);
        birthDate = new Date(y, m - 1, d);
      } else {
        birthDate = new Date(dobStr);
      }
    } else {
      birthDate = new Date(dobStr);
    }

    if (isNaN(birthDate.getTime())) return "";

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };

  const handleIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setFormData(prev => ({ ...prev, profilePicture: base64 }));
      setIsScanning(true);
      setError(null);
      try {
        const details = await extractLicenseDetails(base64);
        if (details) {
          const calculatedAge = details.date_of_birth ? calculateAge(details.date_of_birth) : (details.age?.toString() || "");
          
          setFormData(prev => ({
            ...prev,
            name: details.full_name || prev.name,
            age: calculatedAge || prev.age,
            phone: details.mobile_number || prev.phone,
            idNumber: details.id_number || details.license_number || prev.idNumber,
            permanentAddress: details.address || prev.permanentAddress
          }));
          setIdVerified(true);
        }
      } catch (err) {
        console.error("Verification failed", err);
        setError("AI Scanning failed. Please enter details manually.");
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const keysMatch = formData.password && formData.password === formData.confirmPassword;

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keysMatch) {
      setError("Security Access Keys do not match.");
      return;
    }
    if (!formData.age || parseInt(formData.age) < 18) {
      setError("Donors must be at least 18 years old.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    if (!formData.lat) {
      try {
        const coords = await getCurrentPosition();
        formData.lat = coords.latitude;
        formData.lng = coords.longitude;
      } catch (e) {
        // Fallback or ignore
      }
    }

    try {
      const res = await backendService.requestOtp(formData.email);
      if (res.success) {
        setStep('otp');
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError("Network error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await backendService.verifyOtp(formData.email, otp);
      if (res.success) {
        const { confirmPassword, ...dataToSave } = formData;
        onRegister({ 
          ...dataToSave, 
          age: parseInt(formData.age) || 18,
          idVerified, 
          createdAt: new Date().toISOString() 
        });
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError("Verification failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setIsSubmitting(true);
    const res = await backendService.requestOtp(formData.email);
    if (res.success) {
      setCooldown(60);
      setOtp('');
      setError(null);
    } else {
      setError(res.message);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
          {step === 'otp' ? 'Identity Verification' : 'Become a Lifesaver'}
        </h2>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
          {step === 'otp' ? `Verifying email: ${formData.email}` : 'Join the global emergency blood network'}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {step === 'details' ? (
        <form onSubmit={handleInitialSubmit} className="space-y-6">
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-6 text-center group hover:bg-white hover:border-red-400 transition-all">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Aadhaar ID Card Scan</h3>
            <div className="flex flex-col items-center justify-center">
              {formData.profilePicture ? (
                <div className="relative">
                  <img src={formData.profilePicture} alt="ID Scan" className="w-48 h-32 object-cover rounded-2xl border-2 border-white shadow-md" />
                  {isScanning && (
                    <div className="absolute inset-0 bg-slate-900/80 rounded-2xl flex flex-col items-center justify-center backdrop-blur-sm">
                      <Activity className="w-8 h-8 text-white animate-spin mb-2" />
                      <span className="text-[9px] font-black text-white uppercase tracking-widest">AI Scanning...</span>
                    </div>
                  )}
                  <button type="button" onClick={() => { setFormData(prev => ({ ...prev, profilePicture: '' })); setIdVerified(false); }} className="absolute -top-2 -right-2 p-1.5 bg-red-600 rounded-full text-white shadow-lg hover:scale-110 transition-transform"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full max-w-[240px] h-32 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-slate-100 transition-all"><Camera className="w-8 h-8 text-slate-300 group-hover:text-red-500 transition-all" /><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scan Aadhaar for Auto-fill</span></button>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleIdUpload} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="group">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Full Legal Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" required placeholder="Name as per Aadhaar" className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all font-bold text-slate-800 text-sm" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Blood Type</label>
                <div className="relative">
                  <Droplets className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all font-bold text-slate-800 text-sm appearance-none" value={formData.bloodType} onChange={(e) => setFormData({...formData, bloodType: e.target.value as BloodType})}>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Age</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="number" required placeholder="18+" min="18" className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all font-bold text-slate-800 text-sm" value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} />
                </div>
              </div>
              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Mobile</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="tel" required placeholder="+91..." className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all font-bold text-slate-800 text-sm" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="group">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Permanent Address</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" required placeholder="Address as per Aadhaar" className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all font-bold text-slate-800 text-sm" value={formData.permanentAddress} onChange={(e) => setFormData({...formData, permanentAddress: e.target.value})} />
              </div>
            </div>

            <div className="group">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="email" required placeholder="name@example.com" className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all font-bold text-slate-800 text-sm" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Security Access Key</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type={showKey ? "text" : "password"} required placeholder="••••••••" className={`w-full pl-11 pr-11 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all font-bold text-slate-800 text-sm ${keysMatch ? 'border-emerald-500 bg-emerald-50/20' : ''}`} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                  <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Confirm Access Key</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type={showKey ? "text" : "password"} required placeholder="••••••••" className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all font-bold text-slate-800 text-sm ${keysMatch ? 'border-emerald-500 bg-emerald-50/20' : ''}`} value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} />
                </div>
              </div>
            </div>
            {formData.confirmPassword && (
              <div className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ml-1 ${keysMatch ? 'text-emerald-600' : 'text-red-500'}`}>
                {keysMatch ? <><CheckCircle2 className="w-3 h-3" /> Keys Synchronized</> : <><AlertCircle className="w-3 h-3" /> Keys Must Match</>}
              </div>
            )}
          </div>

          <button type="submit" disabled={isSubmitting || isScanning || !keysMatch} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-slate-800 transition-all shadow-xl disabled:opacity-70 flex items-center justify-center gap-2 group">
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Generate Verification Token <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyAndRegister} className="space-y-8 animate-in slide-in-from-right-4 duration-500">
          <div className="space-y-4">
            <div className="group">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-1 text-center">Verification Code</label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="text" required maxLength={6} placeholder="000000" className="w-full pl-14 pr-4 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-600 font-black text-2xl tracking-[0.5em] text-center text-slate-800" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} />
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <button type="button" onClick={handleResend} disabled={cooldown > 0 || isSubmitting} className={`text-xs font-bold uppercase tracking-widest transition-colors ${cooldown > 0 ? 'text-slate-300' : 'text-red-600 hover:text-red-700'}`}>
                {cooldown > 0 ? `Resend Code in ${cooldown}s` : 'Resend Verification Code'}
              </button>
              <button type="button" onClick={() => setStep('details')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600">Edit Details</button>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting || otp.length < 6} className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-all shadow-2xl flex items-center justify-center gap-3">
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Register & Verify Account <ShieldCheck className="w-5 h-5" /></>}
          </button>
        </form>
      )}
      <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest mt-6">By registering, you agree to our medical data privacy protocols.</p>
    </div>
  );
};

export default DonorRegistrationForm;
