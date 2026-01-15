
import React, { useState, useEffect } from 'react';
import { Mail, X, Check, Copy, Clock, ShieldCheck } from 'lucide-react';

const MailInterceptor: React.FC = () => {
  const [intercepted, setIntercepted] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleMail = (e: any) => {
      setIntercepted(e.detail);
      // Auto-hide after 15 seconds
      setTimeout(() => setIntercepted(null), 15000);
    };
    window.addEventListener('RED_CONNECT_MAIL_INTERCEPT', handleMail);
    return () => window.removeEventListener('RED_CONNECT_MAIL_INTERCEPT', handleMail);
  }, []);

  if (!intercepted) return null;

  const copyOtp = () => {
    navigator.clipboard.writeText(intercepted.otp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed top-8 right-8 z-[200] w-full max-w-sm bg-white rounded-3xl shadow-2xl border-2 border-slate-100 overflow-hidden animate-in slide-in-from-right-8 duration-500">
      <div className="bg-slate-900 p-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-red-500" />
          <span className="text-[10px] font-black uppercase tracking-widest">Secure Mail Relay</span>
        </div>
        <button onClick={() => setIntercepted(null)} className="p-1 hover:bg-white/10 rounded-lg">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Incoming Verification</p>
            <p className="text-xs font-bold text-slate-800">To: {intercepted.email}</p>
          </div>
        </div>
        
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 relative group">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Auth Token</p>
          <p className="text-3xl font-black text-slate-900 tracking-[0.2em]">{intercepted.otp}</p>
          <button 
            onClick={copyOtp}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between text-[9px] font-bold text-slate-400">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> Valid for 5 minutes
          </div>
          <span>{intercepted.timestamp}</span>
        </div>
      </div>
    </div>
  );
};

export default MailInterceptor;
