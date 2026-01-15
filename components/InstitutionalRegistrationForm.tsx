
import React, { useState, useRef, useEffect } from 'react';
import { Landmark, Building2, User, Mail, ShieldCheck, Activity, Camera, Check, Trash2, Sparkles, MapPin, ChevronRight, Calendar, Smartphone, Lock, Loader2, KeyRound, Eye, EyeOff, Award, AlertCircle } from 'lucide-react';
import { extractLicenseDetails } from '../services/geminiService';
import { backendService } from '../services/backendService';

interface InstitutionalRegistrationFormProps {
  type: 'BloodBank' | 'Hospital';
  onRegister: (data: any) => void;
}

const InstitutionalRegistrationForm: React.FC<InstitutionalRegistrationFormProps> = ({ type, onRegister }) => {
  const [formData, setFormData] = useState({
    adminName: '',
    institutionName: '',
    email: '',
    address: '',
    licenseNumber: '',
    expiryDate: '',
    gender: 'Male',
    mobile: '',
    otp: '',
    accessKey: '',
    confirmAccessKey: '',
    scanPreview: ''
  });

  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isOtpSending, setIsOtpSending] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let timer: number;
    if (cooldown > 0) timer = window.setInterval(() => setCooldown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setFormData(prev => ({ ...prev, scanPreview: base64 }));
      setIsScanning(true);
      try {
        const details = await extractLicenseDetails(base64);
        if (details) {
          setFormData(prev => ({
            ...prev,
            adminName: details.full_name || prev.adminName,
            licenseNumber: details.license_number || prev.licenseNumber,
            address: details.address || prev.address,
            expiryDate: details.expiry_date || prev.expiryDate,
            institutionName: details.institution_name || prev.institutionName
          }));
          setIsVerified(true);
        }
      } catch (err) {
        console.error("AI Scan failed", err);
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSendOtp = async () => {
    if (!formData.email) {
      alert("Institutional email is required for verification.");
      return;
    }
    setIsOtpSending(true);
    setError(null);
    try {
      const res = await backendService.requestOtp(formData.email);
      if (res.success) {
        setIsOtpSent(true);
        setCooldown(60);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError("Failed to trigger secure relay.");
    } finally {
      setIsOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await backendService.verifyOtp(formData.email, formData.otp);
      if (res.success) {
        setIsOtpVerified(true);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError("Verification failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const keysMatch = formData.accessKey && formData.accessKey === formData.confirmAccessKey;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOtpVerified) {
      alert("Identity verification required.");
      return;
    }
    if (!keysMatch) {
      alert("Access keys do not match.");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      onRegister(formData);
      setIsSubmitting(false);
    }, 1500);
  };

  const inputBaseClass = "w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-600 font-bold text-slate-900 transition-all shadow-sm placeholder:text-slate-300";

  return (
    <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 max-h-[85vh] overflow-y-auto scrollbar-hide">
      <div className="bg-slate-900 p-8 text-white relative sticky top-0 z-40 border-b-2 border-slate-800 shadow-lg">
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2.5 bg-red-600 rounded-2xl shadow-xl shadow-red-900/40">{type === 'BloodBank' ? <Landmark className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}</div>
          <div>
            <h2 className="text-xl font-black tracking-tight uppercase">Institutional Onboarding</h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{type} LICENSE VERIFICATION GATEWAY</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-10 space-y-12 bg-slate-50/20">
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <div className="space-y-6">
          <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px]">01</span> Credential Validation</h3>
          <div className="bg-white border-2 border-dashed border-slate-300 rounded-[3rem] p-10 text-center transition-all hover:bg-slate-50 hover:border-red-400 group relative">
            {formData.scanPreview ? (
              <div className="relative w-fit mx-auto">
                <img src={formData.scanPreview} className="w-72 h-44 object-cover rounded-[2.5rem] shadow-2xl border-4 border-white" />
                {isScanning && <div className="absolute inset-0 bg-slate-900/80 rounded-[2.5rem] flex flex-col items-center justify-center backdrop-blur-[6px]"><Loader2 className="w-12 h-12 text-white animate-spin mb-3" /><span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Extracting Credentials...</span></div>}
                <button type="button" onClick={() => { setFormData(prev => ({ ...prev, scanPreview: '', adminName: '', licenseNumber: '', address: '', expiryDate: '', institutionName: '' })); setIsVerified(false); }} className="absolute -top-4 -right-4 p-3 bg-red-600 text-white rounded-full shadow-2xl border-4 border-white"><Trash2 className="w-5 h-5" /></button>
              </div>
            ) : (
              <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer space-y-5">
                <div className="w-24 h-24 bg-slate-50 rounded-[2rem] shadow-sm border-2 border-slate-200 flex items-center justify-center mx-auto group-hover:scale-110 group-hover:bg-red-50 transition-all duration-500"><Award className="w-12 h-12 text-slate-300 group-hover:text-red-500" /></div>
                <div><p className="text-lg font-black text-slate-800 tracking-tight">Upload Medical License</p><p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest max-w-xs mx-auto text-center">Auto-fills professional details</p></div>
              </div>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>
        </div>

        <div className="space-y-8">
          <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px]">02</span> Institutional Identity</h3>
          <div className="space-y-4">
             <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="text" required placeholder="Official Facility Name" className={inputBaseClass} value={formData.institutionName} onChange={e => setFormData({...formData, institutionName: e.target.value})} />
             </div>
             <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="email" required placeholder="Administrative Email (For Verification)" className={inputBaseClass} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
             </div>
          </div>
          
          <div className="space-y-4 pt-4">
            {!isOtpVerified && isOtpSent && (
              <div className="flex flex-col sm:flex-row gap-4 animate-in slide-in-from-top-6 duration-500">
                <div className="relative flex-1">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="text" maxLength={6} placeholder="6-DIGIT CODE" className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-red-500/10 font-black text-slate-900 text-center tracking-[0.6em]" value={formData.otp} onChange={e => setFormData({...formData, otp: e.target.value.replace(/\D/g, '')})} />
                </div>
                <button type="button" onClick={handleVerifyOtp} disabled={isSubmitting || formData.otp.length < 6} className="px-8 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'VERIFY'}
                </button>
              </div>
            )}

            {!isOtpVerified && !isOtpSent && (
              <button type="button" onClick={handleSendOtp} disabled={isOtpSending || !formData.email} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-all">
                {isOtpSending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Request Verification Code'}
              </button>
            )}

            {isOtpVerified && (
              <div className="flex items-center gap-4 text-emerald-700 px-6 py-5 bg-emerald-50 border-2 border-emerald-200 rounded-[2rem]">
                <Check className="w-8 h-8 bg-emerald-600 text-white rounded-full p-1.5 shadow-lg" />
                <div><span className="text-xs font-black uppercase tracking-widest block leading-none mb-1">Email Securely Verified</span><span className="text-[10px] font-bold opacity-70">LICENSE HOLDER CONFIRMED</span></div>
              </div>
            )}
            
            {isOtpSent && !isOtpVerified && (
              <button type="button" onClick={handleSendOtp} disabled={cooldown > 0} className="text-[10px] font-black text-red-600 uppercase tracking-widest text-center w-full">
                {cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend Code'}
              </button>
            )}
          </div>
        </div>

        <div className="space-y-8 pt-8 border-t-2 border-slate-100">
          <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px]">03</span> Secure Credentials</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-2.5">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] ml-2">Access Key</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type={showKey ? "text" : "password"} required placeholder="Secure Access Key" className={inputBaseClass} value={formData.accessKey} onChange={e => setFormData({...formData, accessKey: e.target.value})} />
                <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">{showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
            </div>
            <div className="space-y-2.5">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] ml-2">Confirm Key</label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type={showKey ? "text" : "password"} required className={`${inputBaseClass} ${keysMatch ? 'border-emerald-500 bg-emerald-50/20' : ''}`} value={formData.confirmAccessKey} onChange={e => setFormData({...formData, confirmAccessKey: e.target.value})} />
              </div>
            </div>
          </div>
        </div>

        <button type="submit" disabled={isSubmitting || !isOtpVerified || !keysMatch} className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-xs hover:bg-slate-800 transition-all shadow-2xl disabled:opacity-40">
          Authorize Institutional Access
        </button>
      </form>
    </div>
  );
};

export default InstitutionalRegistrationForm;
