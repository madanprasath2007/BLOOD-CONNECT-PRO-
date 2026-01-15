
import React from 'react';
import { Calendar, ShieldCheck, Info, Heart, ArrowRight, Timer, Droplets, CheckCircle2, AlertCircle } from 'lucide-react';

interface DonationScheduleProps {
  lastDonationDate: string; // ISO format e.g. "2024-10-15"
  bloodType: string;
  onNavigateToDrives: () => void;
}

const DonationSchedule: React.FC<DonationScheduleProps> = ({ lastDonationDate, bloodType, onNavigateToDrives }) => {
  const lastDate = new Date(lastDonationDate);
  const nextEligibleDate = new Date(lastDate);
  nextEligibleDate.setMonth(lastDate.getMonth() + 3); // Standard 3-month window

  const today = new Date();
  const timeDiff = nextEligibleDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
  const isEligible = daysRemaining <= 0;

  // Calculate progress percentage for the 90-day window
  const totalWindowDays = 90;
  const elapsedDays = Math.max(0, totalWindowDays - Math.max(0, daysRemaining));
  const progressPercent = Math.min(100, (elapsedDays / totalWindowDays) * 100);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl shadow-lg ${isEligible ? 'bg-red-600 text-white shadow-red-200' : 'bg-slate-100 text-slate-400 shadow-slate-100'}`}>
                <Heart className={`w-8 h-8 ${isEligible ? 'animate-pulse' : ''}`} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Donation Timeline</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Clinical Recovery Monitoring</p>
              </div>
            </div>

            <div className="flex gap-3">
               <div className="bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 text-center min-w-[100px]">
                 <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Blood Group</span>
                 <span className="text-xl font-black text-slate-800">{bloodType}</span>
               </div>
               <div className="bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 text-center min-w-[120px]">
                 <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Donated</span>
                 <span className="text-xs font-bold text-slate-800">{lastDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
               </div>
            </div>
          </div>

          {/* Status Hero Card */}
          <div className={`p-10 rounded-[2.5rem] border-2 transition-all duration-700 mb-8 ${isEligible ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex flex-col items-center text-center">
              {isEligible ? (
                <div className="w-20 h-20 bg-emerald-600 text-white rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-emerald-200 animate-in zoom-in">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
              ) : (
                <div className="w-20 h-20 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center mb-6">
                  <Timer className="w-10 h-10 animate-spin-slow" />
                </div>
              )}

              <h3 className={`text-3xl font-black tracking-tight mb-2 uppercase ${isEligible ? 'text-emerald-800' : 'text-slate-800'}`}>
                {isEligible ? "You are Eligible!" : `${daysRemaining} Days to Recover`}
              </h3>
              <p className={`text-sm font-medium max-w-sm mb-8 ${isEligible ? 'text-emerald-600' : 'text-slate-500'}`}>
                {isEligible 
                  ? "Your system has fully replenished. You are medically cleared to save more lives today." 
                  : `Your body is currently replenishing red blood cells and iron stores. Safety is our priority.`}
              </p>

              {isEligible ? (
                <button 
                  onClick={onNavigateToDrives}
                  className="px-10 py-5 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-all shadow-xl shadow-red-200 flex items-center gap-3 group"
                >
                  Schedule Next Donation
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <div className="w-full max-w-md">
                   <div className="flex justify-between items-center mb-3">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Recovery Progress</span>
                     <span className="text-xs font-black text-slate-800">{Math.round(progressPercent)}%</span>
                   </div>
                   <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden p-1 border border-white">
                      <div 
                        className="h-full bg-slate-900 rounded-full transition-all duration-1000 ease-out shadow-sm"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                   </div>
                   <div className="flex justify-between mt-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      <span>Donation Day</span>
                      <span className="text-slate-800">Target: {nextEligibleDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                   </div>
                </div>
              )}
            </div>
          </div>

          {/* Health Insights */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <Droplets className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Replenishment Phase</h4>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                The standard 3-month (90 day) window ensures your hemoglobin levels and iron stores (ferritin) return to optimal clinical levels, preventing anemia and fatigue.
              </p>
            </div>

            <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Maintenance Advice</h4>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Focus on iron-rich foods like spinach, lentils, and citrus fruits (Vitamin C aids absorption) during this recovery period to ensure your next donation is successful.
              </p>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <p className="text-[10px] text-blue-700 font-bold leading-normal">
              PRO TIP: Platelet (SDP) donations have a much shorter recovery window (usually 7-14 days). Consult our AI Concierge to see if you can donate platelets earlier!
            </p>
          </div>
        </div>
        
        {/* Background Decals */}
        <Calendar className="absolute -bottom-10 -right-10 w-64 h-64 text-slate-50/50 -rotate-12 pointer-events-none" />
      </div>
      
      <div className="text-center px-4">
         <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-full shadow-sm">
           <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Medical Compliance: e-Raktkosh Standard v2.1</span>
         </div>
      </div>
    </div>
  );
};

export default DonationSchedule;
