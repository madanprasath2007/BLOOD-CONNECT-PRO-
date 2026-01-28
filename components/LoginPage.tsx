
import React, { useState, useEffect } from 'react';
import { Droplet, Mail, Lock, ChevronRight, User, Building2, Landmark, ShieldCheck, ArrowLeft, AlertCircle, Loader2, Sparkles } from 'lucide-react';
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
  const [showDemo, setShowDemo] = useState(false);

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
        setError(`Access Denied: Invalid credentials for ${role} role.`);
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

  const fillDemo = (demo: { email: string; pass: string; role: UserRole }) => {
    setEmail(demo.email);
    setPassword(demo.pass);
    setRole(demo.role);
    setShowDemo(false);
    setError(null); // Clear errors when switching roles
  };

  const demoAccounts = [
    { label: 'Donor: Arjun (O-)', email: 'arjun@donor.com', pass: 'password123', role: 'Donor' as UserRole },
    { label: 'Donor: Priya (A+)', email: 'priya@donor.com', pass: 'password123', role: 'Donor' as UserRole },
    { label: 'Blood Bank: IRT Perunthurai', email: 'irt@tnhealth.gov.in', pass: 'irt123', role: 'BloodBank' as UserRole },
    { label: 'Hospital: Metro ER', email: 'er@metrolife.com', pass: 'hosp123', role: 'Hospital' as UserRole },
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
              <h1 className="text-2xl font-black tracking-tight uppercase">RED COMMAND<span className="text-red-500">PRO</span></h1>
            </div>
            
            <div className="space-y-8">
              <h2 className="text-4xl font-bold leading-tight">Multi-Node <span className="text-red-500 underline decoration-4 underline-offset-8 text-nowrap">Unified Command</span> Center.</h2>
              <p className="text-slate-400 text-lg font-medium leading-relaxed">Secure, authenticated access for donors, banks, and hospitals. Experience real-time synchronization across the global medical network.</p>
              
              <div className="space-y-4 pt-4">
                {[
                  'Role-Based Command Interfaces',
                  'One-Time Token (OTT) Encryption',
                  'Institutional-Grade Identity Verification'
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
          
          <div className="relative z-10 mt-12 p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
            <button 
              onClick={() => setShowDemo(!showDemo)}
              className="w-full flex items-center justify-between text-indigo-400 font-black uppercase text-[10px] tracking-widest hover:text-indigo-300 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Professional Demo Access
              </div>
              <span>{showDemo ? 'Hide' : 'Expand'}</span>
            </button>
            {showDemo && (
              <div className="mt-4 grid grid-cols-1 gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                {demoAccounts.map((demo) => (
                  <button 
                    key={demo.label}
                    onClick={() => fillDemo(demo)}
                    className="text-left px-4 py-2 bg-white/10 rounded-xl text-[10px] font-bold text-slate-300 hover:bg-white/20 hover:text-white transition-all border border-white/5"
                  >
                    {demo.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Droplet className="absolute -bottom-20 -left-20 w-80 h-80 text-white/5 rotate-12" />
        </div>

        <div className="p-8 sm:p-12 flex flex-col justify-center overflow-y-auto max-h-[90vh] scrollbar-hide bg-white">
          {view === 'login' ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-10 text-center md:text-left">
                <h2 className="text-3xl font-black text-slate-800 mb-2 uppercase tracking-tight">{step === 'otp' ? 'Security Relay' : 'Node Login'}</h2>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">{step === 'otp' ? `Verify Token for ${email}` : 'Access Global Medical Cloud'}</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border-2 border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-[10px] font-black uppercase tracking-widest animate-in shake duration-300">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {step === 'credentials' ? (
                <form onSubmit={handleInitialSubmit} className="space-y-6">
                  <div className="grid grid-cols-3 gap-2 mb-8 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                    {(['Donor', 'BloodBank', 'Hospital'] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => { setRole(r); setError(null); }}
                        className={`py-3 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 ${
                          role === r ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {r === 'Donor' ? <User className="w-3.5 h-3.5" /> : r === 'BloodBank' ? <Landmark className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{r === 'BloodBank' ? 'Bank' : r}</span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Institutional Email</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-red-500 transition-colors" />
                        <input type="email" required placeholder="name@medical-relay.com" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-600 focus:bg-white transition-all font-bold text-slate-800 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} />
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
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Generate Verification Token <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
                  </button>
                </form>
              ) : (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1 text-center">Verify 6-Digit Code</label>
                    <OtpInput onComplete={handleOtpComplete} disabled={isLoading} />
                    
                    <div className="flex flex-col items-center gap-3 mt-8">
                      <button 
                        type="button" 
                        onClick={handleResendOtp}
                        disabled={cooldown > 0 || isLoading}
                        className={`text-[10px] font-black uppercase tracking-widest transition-colors ${cooldown > 0 ? 'text-slate-300' : 'text-red-600 hover:text-red-700'}`}
                      >
                        {cooldown > 0 ? `Retry in ${cooldown}s` : 'Request New Token'}
                      </button>
                      <button type="button" onClick={() => setStep('credentials')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Change Credentials</button>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleOtpComplete(otpValue)}
                    disabled={isLoading || otpValue.length < 6} 
                    className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-all shadow-2xl shadow-red-200 flex items-center justify-center gap-3"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verify & Authorize Node <ShieldCheck className="w-5 h-5" /></>}
                  </button>
                </div>
              )}

              <div className="mt-12 pt-10 border-t border-slate-100 space-y-6">
                <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">New Medical Professional Registry</p>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setView('register-bank')} className="flex flex-col items-center gap-3 px-4 py-5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:border-red-200 transition-all group">
                    <Landmark className="w-5 h-5 text-slate-400 group-hover:text-red-600" />
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Register Bank</span>
                  </button>
                  <button onClick={() => setView('register-hospital')} className="flex flex-col items-center gap-3 px-4 py-5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:border-red-200 transition-all group">
                    <Building2 className="w-5 h-5 text-slate-400 group-hover:text-red-600" />
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Register Hosp</span>
                  </button>
                </div>
                <div className="bg-indigo-50/50 p-6 rounded-3xl border-2 border-dashed border-indigo-100 text-center">
                  <p className="text-slate-500 text-[11px] font-bold uppercase tracking-tight">
                    Individual Health Volunteer? <button onClick={() => setView('register-donor')} className="text-indigo-600 font-black hover:underline ml-1">REGISTER AS DONOR</button>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-left-4 duration-500 py-4">
              <button onClick={() => setView('login')} className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-red-600 uppercase tracking-[0.2em] mb-8 transition-colors">
                <ArrowLeft className="w-3 h-3" /> Back to Node Access
              </button>
              {view === 'register-donor' ? (
                <DonorRegistrationForm onRegister={(data) => { backendService.saveDonor(data); setView('login'); }} />
              ) : (
                <InstitutionalRegistrationForm 
                  type={view === 'register-bank' ? 'BloodBank' : 'Hospital'} 
                  onRegister={(data) => { backendService.saveInstitution(data, view === 'register-bank' ? 'BloodBank' : 'Hospital'); setView('login'); }}
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