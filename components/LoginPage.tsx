
import React, { useState, useEffect } from 'react';
import { Droplet, Mail, Lock, ChevronRight, User, Building2, Landmark, ShieldCheck, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { UserRole, AuthenticatedUser, Donor } from '../services/types';
import { backendService } from '../services/backendService';
import InstitutionalRegistrationForm from './InstitutionalRegistrationForm';
import DonorRegistrationForm from './DonorRegistrationForm';
import OtpInput from './OtpInput';
import MailInterceptor from './MailInterceptor';

interface LoginPageProps {
  onLogin: (user: AuthenticatedUser) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [view, setView] = useState<'login' | 'register-bank' | 'register-hospital' | 'register-donor'>('login');
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [role, setRole] = useState<UserRole>('Donor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer: number;
    if (cooldown > 0) {
      timer = window.setInterval(() => setCooldown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const user = await backendService.authenticate(email, password, role);
      if (!user) {
        setError(`Invalid credentials for ${email}.`);
        setIsLoading(false);
        return;
      }

      const res = await backendService.requestOtp(email);
      if (res.success) {
        setStep('otp');
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError("Secure gateway connection failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpComplete = async (otp: string) => {
    setOtpValue(otp);
    setIsLoading(true);
    setError(null);

    try {
      const res = await backendService.verifyOtp(email, otp);
      if (res.success) {
        const authenticatedUser = await backendService.authenticate(email, password, role);
        if (authenticatedUser) onLogin(authenticatedUser);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError("Verification failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setIsLoading(true);
    const res = await backendService.requestOtp(email);
    if (res.success) {
      setCooldown(60);
      setError(null);
    } else {
      setError(res.message);
    }
    setIsLoading(false);
  };

  const handleRegisterDonor = (data: any) => {
    const newDonor: Donor = {
      ...data,
      id: `d-${Date.now()}`,
      password: data.password,
      isAvailable: true,
      distance: 1.5,
      age: data.age || 25,
      lastDonation: 'N/A',
      unitsDonatedYear: 0,
      donationCount: 0
    };
    backendService.saveDonor(newDonor);
    setView('login');
    setStep('credentials');
    setRole('Donor');
    setEmail(data.email);
    setError(null);
  };

  const handleRegisterInstitution = (data: any, type: 'BloodBank' | 'Hospital') => {
    const newInst = { ...data, id: `${type === 'BloodBank' ? 'b' : 'h'}-${Date.now()}` };
    backendService.saveInstitution(newInst, type);
    setView('login');
    setStep('credentials');
    setRole(type);
    setEmail(data.email);
    setError(null);
  };

  const roles: { id: UserRole; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'Donor', label: 'Blood Donor', icon: <User className="w-5 h-5" />, desc: 'Donate blood or track recovery' },
    { id: 'BloodBank', label: 'Blood Bank', icon: <Landmark className="w-5 h-5" />, desc: 'Manage official inventories' },
    { id: 'Hospital', label: 'Hospital', icon: <Building2 className="w-5 h-5" />, desc: 'Post urgent medical cases' },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      <MailInterceptor />
      
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-red-100 rounded-full blur-3xl opacity-50 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>

      <div className="w-full max-w-[1100px] grid md:grid-cols-2 bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden relative z-10 border border-slate-100">
        
        <div className="hidden md:flex flex-col justify-between p-12 bg-slate-900 text-white relative">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-xl shadow-red-900/20">
                <Droplet className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-black tracking-tight uppercase">RED CONNECT<span className="text-red-500">PRO</span></h1>
            </div>
            
            <div className="space-y-8">
              <h2 className="text-4xl font-bold leading-tight">Elite <span className="text-red-500 underline decoration-4 underline-offset-8">Bio-Link</span> Authentication.</h2>
              <p className="text-slate-400 text-lg">Hashed OTP encryption, single-use tokens, and institutional-grade access control for the global blood supply chain.</p>
              
              <div className="space-y-4 pt-4">
                {[
                  'Hashed SHA-256 Storage',
                  '5-Minute Automatic Expiry',
                  'Brute-Force Lock (3 Tries)'
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-sm font-semibold text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <Droplet className="absolute -bottom-20 -left-20 w-80 h-80 text-white/5 rotate-12" />
        </div>

        <div className="p-8 sm:p-12 flex flex-col justify-center overflow-y-auto max-h-[90vh] scrollbar-hide bg-white">
          {view === 'login' ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-10 text-center md:text-left">
                <h2 className="text-3xl font-black text-slate-800 mb-2 uppercase tracking-tight">{step === 'otp' ? 'Safety Verify' : 'Command Access'}</h2>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">{step === 'otp' ? `Verifying Email: ${email}` : 'Institutional Identity Required'}</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border-2 border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-[10px] font-black uppercase tracking-widest animate-in shake duration-300">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {step === 'credentials' ? (
                <form onSubmit={handleInitialSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 gap-3 mb-8">
                    {roles.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => { setRole(r.id); setError(null); }}
                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                          role === r.id ? 'border-red-600 bg-red-50/50 ring-4 ring-red-50' : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50 shadow-sm'
                        }`}
                      >
                        <div className={`p-3 rounded-xl transition-colors ${role === r.id ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                          {r.icon}
                        </div>
                        <div>
                          <h3 className={`font-black text-xs uppercase tracking-widest ${role === r.id ? 'text-red-900' : 'text-slate-800'}`}>{r.label}</h3>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{r.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Institutional Email</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-red-500 transition-colors" />
                        <input type="email" required placeholder="name@medical-node.com" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-600 focus:bg-white transition-all font-bold text-slate-800 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} />
                      </div>
                    </div>
                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Security Access Key</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-red-500 transition-colors" />
                        <input type="password" required placeholder="••••••••" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-600 focus:bg-white transition-all font-bold text-slate-800 text-sm" value={password} onChange={(e) => setPassword(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <button type="submit" disabled={isLoading} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-70 group">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Generate Secure OTP <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
                  </button>
                </form>
              ) : (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1 text-center">Enter 6-Digit Code</label>
                    <OtpInput onComplete={handleOtpComplete} disabled={isLoading} />
                    
                    <div className="flex flex-col items-center gap-3 mt-8">
                      <button 
                        type="button" 
                        onClick={handleResendOtp}
                        disabled={cooldown > 0 || isLoading}
                        className={`text-[10px] font-black uppercase tracking-widest transition-colors ${cooldown > 0 ? 'text-slate-300' : 'text-red-600 hover:text-red-700'}`}
                      >
                        {cooldown > 0 ? `Resend Available in ${cooldown}s` : 'Resend Verification Code'}
                      </button>
                      <button type="button" onClick={() => setStep('credentials')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Change Account Details</button>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleOtpComplete(otpValue)}
                    disabled={isLoading || otpValue.length < 6} 
                    className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-all shadow-2xl shadow-red-200 flex items-center justify-center gap-3"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Authorize Command Access <ShieldCheck className="w-5 h-5" /></>}
                  </button>
                </div>
              )}

              <div className="mt-12 pt-10 border-t border-slate-100 space-y-4">
                <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">New Medical Professional Registry</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button onClick={() => setView('register-bank')} className="flex items-center gap-3 px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl hover:bg-white hover:border-red-200 transition-all group shadow-sm">
                    <div className="p-2 bg-white rounded-xl group-hover:bg-red-50 transition-colors border border-slate-100"><Landmark className="w-4 h-4 text-slate-400 group-hover:text-red-600" /></div>
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Register Bank</span>
                  </button>
                  <button onClick={() => setView('register-hospital')} className="flex items-center gap-3 px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl hover:bg-white hover:border-red-200 transition-all group shadow-sm">
                    <div className="p-2 bg-white rounded-xl group-hover:bg-red-50 transition-colors border border-slate-100"><Building2 className="w-4 h-4 text-slate-400 group-hover:text-red-600" /></div>
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Register Hospital</span>
                  </button>
                </div>
                <div className="bg-slate-900/5 p-6 rounded-3xl border-2 border-dashed border-slate-200 text-center">
                  <p className="text-slate-500 text-[11px] font-bold uppercase tracking-tight">
                    Individual Medical Volunteer? <button onClick={() => setView('register-donor')} className="text-red-600 font-black hover:underline ml-1">REGISTER AS DONOR</button>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-left-4 duration-500 py-4">
              <button onClick={() => setView('login')} className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-red-600 uppercase tracking-[0.2em] mb-8 transition-colors">
                <ArrowLeft className="w-3 h-3" /> Back to Verification
              </button>
              {view === 'register-donor' ? (
                <DonorRegistrationForm onRegister={handleRegisterDonor} />
              ) : (
                <InstitutionalRegistrationForm 
                  type={view === 'register-bank' ? 'BloodBank' : 'Hospital'} 
                  onRegister={(data) => handleRegisterInstitution(data, view === 'register-bank' ? 'BloodBank' : 'Hospital')}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
