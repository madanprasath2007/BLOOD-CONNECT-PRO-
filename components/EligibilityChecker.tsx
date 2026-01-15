
import React, { useState } from 'react';
import { ShieldCheck, Activity, Info, Loader2, CheckCircle2, AlertCircle, Sparkles, Scale, Heart, Thermometer, Pill, User, AlertTriangle } from 'lucide-react';
import { verifyClinicalEligibility } from '../services/geminiService';

interface EligibilityCheckerProps {
  onVerified: (advice: string) => void;
}

const EligibilityChecker: React.FC<EligibilityCheckerProps> = ({ onVerified }) => {
  const [formData, setFormData] = useState({
    age: 25,
    weight: 65,
    recentIllness: false,
    onMedication: false,
    pulse: 72,
    alcohol24h: false,
    sleep7h: true,
    hasChronicConditions: false,
    chronicConditions: ''
  });

  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<{ eligible: boolean; reason: string; advice: string } | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setResult(null);

    try {
      const evaluation = await verifyClinicalEligibility(formData);
      setResult(evaluation);
      if (evaluation.eligible) {
        onVerified(evaluation.advice);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  const inputBaseClass = "w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-bold text-slate-800 text-sm";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-red-600 rounded-2xl shadow-lg shadow-red-200">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Clinical Self-Assessment</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">WHO Pre-Donation Screening Standard</p>
            </div>
          </div>

          {!result ? (
            <form onSubmit={handleVerify} className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Physical Vitals */}
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Physical Vitals</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-600 ml-1">
                        <User className="w-3.5 h-3.5 text-slate-400" /> Age
                      </label>
                      <input 
                        type="number" 
                        className={inputBaseClass} 
                        value={formData.age}
                        min="16"
                        max="80"
                        onChange={e => setFormData({...formData, age: parseInt(e.target.value)})}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-600 ml-1">
                        <Scale className="w-3.5 h-3.5 text-slate-400" /> Weight (KG)
                      </label>
                      <input 
                        type="number" 
                        className={inputBaseClass} 
                        value={formData.weight}
                        onChange={e => setFormData({...formData, weight: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600 ml-1">
                      <Heart className="w-3.5 h-3.5 text-slate-400" /> Current Pulse (BPM)
                    </label>
                    <input 
                      type="number" 
                      className={inputBaseClass} 
                      value={formData.pulse}
                      onChange={e => setFormData({...formData, pulse: parseInt(e.target.value)})}
                    />
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="text-slate-400"><AlertTriangle className="w-4 h-4" /></div>
                        <span className="text-xs font-bold text-slate-700">Chronic Diseases? (Sugar/AIDS/etc)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, hasChronicConditions: !formData.hasChronicConditions})}
                        className={`w-10 h-5 rounded-full relative transition-all ${formData.hasChronicConditions ? 'bg-red-600' : 'bg-slate-300'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${formData.hasChronicConditions ? 'left-5.5' : 'left-0.5'}`}></div>
                      </button>
                    </div>

                    {formData.hasChronicConditions && (
                      <div className="animate-in slide-in-from-top-2">
                        <textarea 
                          className={`${inputBaseClass} min-h-[80px] pt-3 resize-none`}
                          placeholder="Please specify conditions (e.g., Diabetes/Sugar, HIV/AIDS, Hepatitis, etc.)"
                          value={formData.chronicConditions}
                          onChange={e => setFormData({...formData, chronicConditions: e.target.value})}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Safety Questionnaire */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Safety Declaration</h3>
                  
                  {[
                    { key: 'recentIllness', label: 'Any illness in last 14 days?', icon: <Thermometer className="w-4 h-4" /> },
                    { key: 'onMedication', label: 'Currently on medication?', icon: <Pill className="w-4 h-4" /> },
                    { key: 'alcohol24h', label: 'Alcohol in last 24 hours?', icon: <Info className="w-4 h-4" /> },
                    { key: 'sleep7h', label: 'Slept > 7 hours last night?', icon: <CheckCircle2 className="w-4 h-4" /> }
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="text-slate-400">{item.icon}</div>
                        <span className="text-xs font-bold text-slate-700">{item.label}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, [item.key]: !formData[item.key as keyof typeof formData]})}
                        className={`w-10 h-5 rounded-full relative transition-all ${formData[item.key as keyof typeof formData] ? 'bg-red-600' : 'bg-slate-300'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${formData[item.key as keyof typeof formData] ? 'left-5.5' : 'left-0.5'}`}></div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50">
                <button 
                  type="submit"
                  disabled={isVerifying}
                  className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-slate-800 transition-all shadow-2xl flex items-center justify-center gap-3 group disabled:opacity-50"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      RUNNING CLINICAL VERIFICATION...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Verify Eligibility via Gemini Pro
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="animate-in zoom-in duration-500 py-10">
              <div className="max-w-md mx-auto text-center">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl ${result.eligible ? 'bg-emerald-100 text-emerald-600 shadow-emerald-100' : 'bg-red-100 text-red-600 shadow-red-100'}`}>
                  {result.eligible ? <ShieldCheck className="w-12 h-12" /> : <AlertCircle className="w-12 h-12" />}
                </div>
                
                <h3 className={`text-3xl font-black uppercase tracking-tight mb-2 ${result.eligible ? 'text-emerald-800' : 'text-red-800'}`}>
                  {result.eligible ? "Clinical Clearance Granted" : "Clearance Denied"}
                </h3>
                
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Verification ID: RED-{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                
                <div className={`p-6 rounded-3xl border text-sm font-medium leading-relaxed mb-8 ${result.eligible ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                  <p className="font-black mb-2 uppercase text-[10px] tracking-widest opacity-60">Status Assessment</p>
                  {result.reason}
                  <div className="mt-4 pt-4 border-t border-current/10 italic text-[11px]">
                    <strong>Professional Advice:</strong> {result.advice}
                  </div>
                </div>

                <button 
                  onClick={() => setResult(null)}
                  className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all"
                >
                  Recalculate Vitals
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Background Decal */}
        <ShieldCheck className="absolute -bottom-10 -left-10 w-64 h-64 text-slate-50/50 -rotate-12 pointer-events-none" />
      </div>

      <div className="bg-amber-50 border border-amber-100 p-5 rounded-[2rem] flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
        <p className="text-[10px] text-amber-800 font-bold leading-relaxed uppercase tracking-wide">
          Disclaimer: This AI-powered assessment is a preliminary screening tool based on self-reported data. The final physical examination by a registered medical officer at the donation site is mandatory and binding. Chronic conditions like HIV/AIDS or certain stages of Diabetes may lead to permanent or temporary deferral.
        </p>
      </div>
    </div>
  );
};

export default EligibilityChecker;
