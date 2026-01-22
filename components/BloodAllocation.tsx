
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ClipboardCheck, 
  Truck, 
  Package, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  Loader2, 
  Droplet, 
  Building2, 
  Activity, 
  Zap,
  SendHorizontal,
  BrainCircuit,
  Radio
} from 'lucide-react';
import { EmergencyRequest, BloodBag, BloodType } from '../services/types';
import { backendService } from '../services/backendService';
import { getLogisticBriefing } from '../services/geminiService';
import { COMPATIBILITY_MATRIX } from '../constants';

interface AllocationProps {
  bankId: string;
  bankName: string;
}

const BloodAllocation: React.FC<AllocationProps> = ({ bankId, bankName }) => {
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [inventory, setInventory] = useState<BloodBag[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedBagIds, setSelectedBagIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAllocating, setIsAllocating] = useState(false);
  const [logisticBrief, setLogisticBrief] = useState<string | null>(null);
  const [isLoadingBrief, setIsLoadingBrief] = useState(false);

  useEffect(() => {
    loadData();
  }, [bankId]);

  const loadData = () => {
    setIsLoading(true);
    setTimeout(() => {
      const allReqs = backendService.getEmergencyRequests();
      const allBags = backendService.getBloodBags();
      setRequests(allReqs.filter(r => r.status !== 'Fulfilled'));
      setInventory(allBags.filter(b => (b.bankId === bankId || !b.bankId) && b.status === 'Available'));
      setIsLoading(false);
    }, 600);
  };

  const selectedRequest = useMemo(() => 
    requests.find(r => r.id === selectedRequestId), 
    [requests, selectedRequestId]
  );

  useEffect(() => {
    if (selectedRequest && (selectedRequest.status === 'Allocated' || selectedRequest.status === 'Dispatched')) {
      fetchBrief();
    } else {
      setLogisticBrief(null);
    }
  }, [selectedRequest]);

  const fetchBrief = async () => {
    if (!selectedRequest) return;
    setIsLoadingBrief(true);
    // FIX: getLogisticBriefing returns { text: string; sources: any[] }. We need the .text property.
    const brief = await getLogisticBriefing(bankName, selectedRequest.hospital);
    setLogisticBrief(brief.text);
    setIsLoadingBrief(false);
  };

  const compatibleBags = useMemo(() => {
    if (!selectedRequest) return [];
    const compatibleTypes = COMPATIBILITY_MATRIX[selectedRequest.bloodType];
    return inventory.filter(bag => compatibleTypes.includes(bag.type as BloodType));
  }, [inventory, selectedRequest]);

  const toggleBagSelection = (bagId: string) => {
    if (selectedBagIds.includes(bagId)) {
      setSelectedBagIds(prev => prev.filter(id => id !== bagId));
    } else {
      if (selectedRequest && selectedBagIds.length < selectedRequest.unitsNeeded) {
        setSelectedBagIds(prev => [...prev, bagId]);
      }
    }
  };

  const handleAllocate = async () => {
    if (!selectedRequestId || selectedBagIds.length === 0) return;
    setIsAllocating(true);
    try {
      await backendService.allocateBlood(selectedRequestId, selectedBagIds);
      loadData();
    } catch (err) {
      console.error("Allocation failed", err);
    } finally {
      setIsAllocating(false);
    }
  };

  const handleDispatch = async () => {
    if (!selectedRequestId) return;
    setIsAllocating(true);
    try {
      backendService.updateEmergencyRequestStatus(selectedRequestId, 'Dispatched');
      loadData();
    } catch (err) {
      console.error("Dispatch failed", err);
    } finally {
      setIsAllocating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-red-600" />
        <p className="font-black uppercase tracking-widest text-xs text-center">Opening Secure Transport Channels...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Dispatch Terminal</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Global Relay Hub • {bankName}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-2xl shadow-xl border border-white/5">
          <Activity className="w-4 h-4 text-red-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest">{requests.length} Cases in Queue</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-4">
          <div className="space-y-3">
            {requests.map(req => (
              <button
                key={req.id}
                onClick={() => {
                  setSelectedRequestId(req.id);
                  setSelectedBagIds([]);
                }}
                className={`w-full text-left p-6 rounded-[2.5rem] border-2 transition-all flex items-center justify-between group ${
                  selectedRequestId === req.id 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-2xl scale-[1.02]' 
                    : 'bg-white border-slate-100 hover:border-red-100'
                }`}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border-2 transition-colors ${
                    selectedRequestId === req.id ? 'bg-white/10 border-white/20' : 'bg-red-50 border-red-100 text-red-600'
                  }`}>
                    {req.bloodType}
                  </div>
                  <div>
                    <h4 className="font-black text-sm uppercase truncate max-w-[180px]">{req.hospital}</h4>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                        req.status === 'Allocated' ? 'bg-amber-100 text-amber-700' : 
                        req.status === 'Dispatched' ? 'bg-indigo-100 text-indigo-700' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {req.status === 'Dispatched' ? 'TRANSIT' : req.status}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 transition-transform ${selectedRequestId === req.id ? 'translate-x-1' : 'text-slate-200'}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7">
          {selectedRequest ? (
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden h-full flex flex-col">
              <div className="bg-slate-900 p-8 text-white relative">
                <div className="relative z-10 flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-red-600 rounded-xl shadow-lg shadow-red-900/40">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black tracking-tight uppercase">Operational Brief</h3>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Relay: {selectedRequest.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-4xl font-black">
                      {selectedRequest.status === 'Pending' ? selectedBagIds.length : selectedRequest.unitsNeeded}
                      <span className="text-lg text-slate-500">/{selectedRequest.unitsNeeded}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-8 flex-1 overflow-y-auto space-y-6 scrollbar-hide">
                {/* Tactical Logistics Brief Integration */}
                {(selectedRequest.status === 'Allocated' || selectedRequest.status === 'Dispatched') && (
                  <div className="bg-indigo-50 border-2 border-indigo-100 p-6 rounded-[2rem] animate-in zoom-in duration-500">
                    <div className="flex items-center gap-4 mb-3">
                       <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
                          <BrainCircuit className="w-5 h-5 text-white" />
                       </div>
                       <span className="text-[11px] font-black text-indigo-700 uppercase tracking-widest">Tactical Logistics Brief</span>
                    </div>
                    {isLoadingBrief ? (
                      <div className="flex items-center gap-3 py-2">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                        <span className="text-xs font-bold text-indigo-400 uppercase">Calculating Transport Logic...</span>
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-indigo-900 leading-relaxed italic">"{logisticBrief}"</p>
                    )}
                  </div>
                )}

                {selectedRequest.status === 'Pending' ? (
                  <div className="grid gap-3">
                    {compatibleBags.map(bag => (
                      <button
                        key={bag.id}
                        onClick={() => toggleBagSelection(bag.id)}
                        className={`w-full p-5 rounded-2xl border-2 transition-all flex items-center justify-between ${
                          selectedBagIds.includes(bag.id) 
                            ? 'bg-red-50 border-red-600 ring-4 ring-red-50 shadow-lg' 
                            : 'bg-white border-slate-100 hover:border-red-200'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${
                            selectedBagIds.includes(bag.id) ? 'bg-red-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {bag.type}
                          </div>
                          <div className="text-left">
                            <h5 className="font-black text-slate-800 text-xs uppercase">UNIT {bag.id}</h5>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Expires: {bag.expiryDate}</p>
                          </div>
                        </div>
                        {selectedBagIds.includes(bag.id) && <CheckCircle2 className="w-5 h-5 text-red-600" />}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center space-y-6">
                    <div className={`w-20 h-20 rounded-3xl flex items-center justify-center border-2 shadow-xl ${selectedRequest.status === 'Allocated' ? 'bg-amber-50 text-amber-600 border-amber-100 animate-bounce' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                      {selectedRequest.status === 'Allocated' ? <Truck className="w-10 h-10" /> : <Radio className="w-10 h-10 animate-pulse" />}
                    </div>
                    <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                      {selectedRequest.status === 'Allocated' ? 'Awaiting Dispatch' : 'Active Transit Protocol'}
                    </h4>
                  </div>
                )}
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100">
                {selectedRequest.status === 'Pending' ? (
                  <button
                    disabled={selectedBagIds.length < selectedRequest.unitsNeeded || isAllocating}
                    onClick={handleAllocate}
                    className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-red-600 transition-all shadow-2xl disabled:opacity-30 flex items-center justify-center gap-3"
                  >
                    {isAllocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ClipboardCheck className="w-5 h-5" /> Confirm Digital Allocation</>}
                  </button>
                ) : selectedRequest.status === 'Allocated' ? (
                  <button
                    disabled={isAllocating}
                    onClick={handleDispatch}
                    className="w-full bg-red-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-slate-900 transition-all shadow-2xl flex items-center justify-center gap-3 animate-pulse"
                  >
                    {isAllocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><SendHorizontal className="w-5 h-5" /> Initiate Transport Relay</>}
                  </button>
                ) : (
                  <div className="bg-emerald-50 border-2 border-emerald-100 p-5 rounded-[2rem] flex items-center gap-4 text-emerald-700">
                    <CheckCircle2 className="w-8 h-8" />
                    <span className="text-[11px] font-black uppercase tracking-widest">Relay Active: Monitor GPS for Hub Link</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-[3rem] border-4 border-dashed border-slate-100">
              <ClipboardCheck className="w-16 h-16 text-slate-100 mb-6" />
              <h3 className="text-lg font-black text-slate-400 uppercase tracking-tight">System Status: Waiting for Command</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BloodAllocation;
