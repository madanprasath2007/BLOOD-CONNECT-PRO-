
import React, { useState } from 'react';
import { EmergencyRequest } from '../services/types';
import { 
  Clock, 
  Activity, 
  CheckCircle2, 
  Zap, 
  Truck, 
  ShieldCheck, 
  Package,
  Building2,
  ChevronRight,
  Loader2,
  PackageCheck,
  AlertCircle,
  Radio,
  Timer
} from 'lucide-react';
import { backendService } from '../services/backendService';

interface Props {
  hospitalName: string;
  requests: EmergencyRequest[];
}

const HospitalStatusDashboard: React.FC<Props> = ({ hospitalName, requests }) => {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const myRequests = requests.filter(r => r.hospital === hospitalName);

  const getStepStatus = (currentStatus: EmergencyRequest['status'], step: string) => {
    const statusOrder: EmergencyRequest['status'][] = ['Pending', 'Allocated', 'Dispatched', 'Received'];
    const currentIndex = statusOrder.indexOf(currentStatus || 'Pending');
    const stepIndex = statusOrder.indexOf(step as any);

    if (currentIndex > stepIndex) return 'completed';
    if (currentIndex === stepIndex) return 'active';
    return 'pending';
  };

  const handleUpdateStatus = (reqId: string, nextStatus: EmergencyRequest['status']) => {
    setConfirmingId(reqId);
    setTimeout(() => {
      backendService.updateEmergencyRequestStatus(reqId, nextStatus);
      setConfirmingId(null);
    }, 1000);
  };

  const getStatusBadge = (status: EmergencyRequest['status']) => {
    switch (status) {
      case 'Received':
        return (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-200 border border-emerald-400 animate-in zoom-in duration-300">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Mission Success</span>
          </div>
        );
      case 'Dispatched':
        return (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-200 border border-amber-400 animate-pulse">
            <Truck className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">In Transit</span>
          </div>
        );
      case 'Allocated':
        return (
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 border border-indigo-400">
            <Package className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Units Secured</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl shadow-lg shadow-red-200 border border-red-400 animate-pulse">
            <Radio className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Relay Active</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between px-2">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">SOS Command Tracking</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Cloud Relay for {myRequests.length} Active Cases</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-2xl shadow-xl">
          <Activity className="w-4 h-4 text-red-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest">Network Live</span>
        </div>
      </div>

      <div className="grid gap-8">
        {myRequests.length === 0 ? (
          <div className="py-32 bg-white rounded-[3rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-center">
            <ShieldCheck className="w-16 h-16 text-slate-100 mb-4" />
            <h4 className="text-slate-400 font-black uppercase tracking-widest">Command Center Idle</h4>
            <p className="text-slate-300 text-xs font-bold mt-2">Broadcast a case from "SOS Broadcast" or "Post Case".</p>
          </div>
        ) : (
          myRequests.map(req => {
            const isReceived = req.status === 'Received' || req.status === 'Fulfilled';
            const isDispatched = req.status === 'Dispatched';
            const isAllocated = req.status === 'Allocated';

            return (
              <div key={req.id} className={`bg-white rounded-[2.5rem] border overflow-hidden transition-all duration-500 ${isReceived ? 'border-emerald-100 shadow-md' : 'border-slate-100 shadow-2xl hover:shadow-slate-300/50'}`}>
                {/* Header Module - Tactical Enhancement */}
                <div className={`${isReceived ? 'bg-emerald-600' : 'bg-slate-900'} p-8 text-white relative overflow-hidden`}>
                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-6">
                      <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-black border-2 transition-all ${isReceived ? 'bg-white text-emerald-600 border-white' : 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-900/50'}`}>
                        <span className="text-3xl">{req.bloodType}</span>
                        <span className="text-[8px] opacity-60 uppercase">{req.isPlateletRequest ? 'PLT' : 'WB'}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-4 flex-wrap mb-2">
                           <h3 className="text-3xl font-black uppercase tracking-tight leading-none">{req.patientName}</h3>
                           {getStatusBadge(req.status)}
                        </div>
                        <div className="flex items-center gap-3 opacity-60">
                          <span className="text-[10px] font-bold uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded">{req.unitsNeeded} UNITS REQ</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest">{req.urgency} PRIORITY</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest">ID: {req.id}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white/5 border border-white/10 backdrop-blur-md p-4 rounded-2xl min-w-[160px] text-right">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">CURRENT PHASE</p>
                       <p className={`text-xl font-black uppercase tracking-tight ${isReceived ? 'text-white' : isDispatched ? 'text-amber-400' : isAllocated ? 'text-indigo-400' : 'text-red-500'}`}>
                        {isDispatched ? 'TRANSIT' : isReceived ? 'SUCCESS' : isAllocated ? 'SECURED' : 'BROADCAST'}
                       </p>
                    </div>
                  </div>
                  {/* Background Decal */}
                  <ShieldCheck className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 rotate-12" />
                </div>

                {/* Progress Visualizer */}
                <div className="p-10 bg-slate-50/30">
                  <div className="relative flex justify-between max-w-4xl mx-auto px-4">
                    {/* Background Progress Line */}
                    <div className="absolute top-7 left-0 w-full h-1.5 bg-slate-200 -z-10 rounded-full">
                      <div 
                        className={`h-full transition-all duration-1000 rounded-full ${isReceived ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.4)]'}`} 
                        style={{ width: req.status === 'Pending' ? '0%' : isAllocated ? '33%' : isDispatched ? '66%' : '100%' }}
                      ></div>
                    </div>

                    {[
                      { id: 'Pending', label: 'LOGGED', icon: Zap },
                      { id: 'Allocated', label: 'SECURED', icon: Package },
                      { id: 'Dispatched', label: 'TRANSIT', icon: Truck },
                      { id: 'Received', label: 'RECEIVED', icon: CheckCircle2 }
                    ].map((step, idx) => {
                      const state = getStepStatus(req.status, step.id);
                      const Icon = step.icon;
                      
                      return (
                        <div key={step.id} className="flex flex-col items-center gap-4 relative">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 border-4 ${
                            state === 'completed' ? 'bg-red-600 border-red-50 text-white shadow-lg' :
                            state === 'active' ? 'bg-white border-red-600 text-red-600 shadow-xl scale-110 z-10' :
                            'bg-white border-slate-100 text-slate-200 shadow-sm'
                          }`}>
                            {state === 'completed' && step.id !== 'Received' ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                          </div>
                          <div className="text-center">
                            <p className={`text-[10px] font-black uppercase tracking-widest ${state === 'pending' ? 'text-slate-300' : 'text-slate-800'}`}>{step.label}</p>
                            {state === 'active' && <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] font-black text-red-600 animate-pulse uppercase whitespace-nowrap">ACTIVE NODE</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Operational Action Buttons */}
                  <div className="mt-14 flex justify-center">
                     {isDispatched && (
                       <button 
                          disabled={confirmingId === req.id}
                          onClick={() => handleUpdateStatus(req.id, 'Received')}
                          className="flex items-center gap-3 px-12 py-5 bg-emerald-600 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-emerald-700 shadow-2xl shadow-emerald-200 transition-all active:scale-95 group"
                       >
                         {confirmingId === req.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <><PackageCheck className="w-5 h-5 group-hover:scale-125 transition-transform" /> Confirm Secure Receipt</>}
                       </button>
                     )}
                     {req.status === 'Pending' && (
                       <div className="flex flex-col items-center gap-3 bg-white border border-slate-100 px-10 py-6 rounded-[2.5rem] shadow-sm animate-in slide-in-from-top-4">
                          <div className="flex items-center gap-3">
                             <div className="p-2 bg-red-50 rounded-lg animate-pulse">
                                <AlertCircle className="w-5 h-5 text-red-500" />
                             </div>
                             <span className="text-[11px] font-black text-slate-800 uppercase tracking-[0.15em]">Broadcasting to State Network</span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium text-center">Your request is live. Awaiting institutional matching and allocation.</p>
                       </div>
                     )}
                     {isAllocated && (
                       <div className="flex flex-col items-center gap-3 bg-amber-50 border border-amber-100 px-10 py-6 rounded-[2.5rem] shadow-sm">
                          <div className="flex items-center gap-3">
                             <div className="p-2 bg-amber-100 rounded-lg animate-bounce">
                                <Truck className="w-5 h-5 text-amber-600" />
                             </div>
                             <span className="text-[11px] font-black text-amber-700 uppercase tracking-[0.15em]">Preparing for Logistics Relay</span>
                          </div>
                          <p className="text-[11px] text-amber-800 font-medium text-center">Units have been secured by a blood bank. Transport dispatch in progress.</p>
                       </div>
                     )}
                     {isReceived && (
                       <div className="flex flex-col items-center gap-3 px-12 py-6 bg-emerald-50 text-emerald-700 rounded-[2.5rem] border-2 border-emerald-200 shadow-sm">
                          <div className="flex items-center gap-3">
                             <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                             <span className="text-[11px] font-black uppercase tracking-[0.2em]">Clinical Chain Fulfilled</span>
                          </div>
                          <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Transaction log synchronized with e-RaktKosh</p>
                       </div>
                     )}
                  </div>
                </div>

                <div className="px-8 py-4 bg-white border-t border-slate-100 flex items-center justify-between text-[9px] font-bold text-slate-400">
                  <div className="flex items-center gap-2">
                    <Timer className="w-3.5 h-3.5" />
                    <span className="uppercase">Elapsed: 12m 45s • Cloud Audit Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="uppercase">Validated via State Command Hub</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default HospitalStatusDashboard;
