
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
  Search, 
  ShieldCheck, 
  Landmark, 
  Zap,
  ArrowRight
} from 'lucide-react';
import { EmergencyRequest, BloodBag, BloodType } from '../services/types';
import { backendService } from '../services/backendService';
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
  const [filterType, setFilterType] = useState<BloodType | 'All'>('All');

  useEffect(() => {
    loadData();
  }, [bankId]);

  const loadData = () => {
    setIsLoading(true);
    setTimeout(() => {
      const allReqs = backendService.getEmergencyRequests();
      const allBags = backendService.getBloodBags();
      
      setRequests(allReqs.filter(r => r.status === 'Pending' || r.status === 'Allocated'));
      setInventory(allBags.filter(b => b.bankId === bankId && b.status === 'Available'));
      setIsLoading(false);
    }, 600);
  };

  const selectedRequest = useMemo(() => 
    requests.find(r => r.id === selectedRequestId), 
    [requests, selectedRequestId]
  );

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
      setSelectedRequestId(null);
      setSelectedBagIds([]);
      loadData();
    } catch (err) {
      console.error("Allocation failed", err);
    } finally {
      setIsAllocating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-red-600" />
        <p className="font-black uppercase tracking-widest text-xs">Accessing Command Dispatch Queue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Dispatch Command</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Fulfilling Emergency Network Requests</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-2xl shadow-xl">
          <Activity className="w-4 h-4 text-red-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest">{requests.filter(r => r.status === 'Pending').length} Pending SOS</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Side: Requests List */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 mb-4">Urgent Request Queue</h3>
          <div className="space-y-3">
            {requests.map(req => (
              <button
                key={req.id}
                onClick={() => {
                  setSelectedRequestId(req.id);
                  setSelectedBagIds([]);
                }}
                className={`w-full text-left p-6 rounded-[2rem] border-2 transition-all flex items-center justify-between group ${
                  selectedRequestId === req.id 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-2xl' 
                    : 'bg-white border-slate-100 hover:border-red-100 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border-2 ${
                    selectedRequestId === req.id ? 'bg-white/10 border-white/20' : 'bg-red-50 border-red-100 text-red-600'
                  }`}>
                    {req.bloodType}
                  </div>
                  <div>
                    <h4 className="font-black text-sm uppercase tracking-tight">{req.hospital}</h4>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${
                      selectedRequestId === req.id ? 'text-slate-400' : 'text-slate-50'
                    }`}>
                      <span className={selectedRequestId === req.id ? 'text-slate-400' : 'text-slate-500'}>
                        {req.unitsNeeded} UNITS • {req.urgency}
                      </span>
                      {req.status === 'Allocated' && (
                        <span className="ml-2 text-emerald-500 font-black">● ALLOCATED</span>
                      )}
                    </p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 transition-transform ${selectedRequestId === req.id ? 'translate-x-1' : 'text-slate-200'}`} />
              </button>
            ))}
            {requests.length === 0 && (
              <div className="py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center px-8">
                <ShieldCheck className="w-12 h-12 text-slate-200 mb-4" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Relay Synchronized</p>
                <p className="text-xs text-slate-300 font-bold mt-1">No pending emergency requests in your sector.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Inventory Matching */}
        <div className="lg:col-span-7">
          {selectedRequest ? (
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden animate-in slide-in-from-right-4 duration-500 h-full flex flex-col">
              <div className="bg-slate-900 p-8 text-white">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-red-600 rounded-xl">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black tracking-tight uppercase">Allocation Control</h3>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Case ID: {selectedRequest.id.toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-4xl font-black">{selectedBagIds.length}<span className="text-lg text-slate-500">/{selectedRequest.unitsNeeded}</span></span>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Units Selected</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Target Patient</p>
                    <p className="text-sm font-bold">{selectedRequest.patientName}</p>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Medical Facility</p>
                    <p className="text-sm font-bold truncate">{selectedRequest.hospital}</p>
                  </div>
                </div>
              </div>

              <div className="p-8 flex-1 overflow-y-auto space-y-4 scrollbar-hide">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Compatible Units in Vault</h4>
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">AI Matching Active</span>
                  </div>
                </div>

                <div className="grid gap-3">
                  {compatibleBags.map(bag => {
                    const isSelected = selectedBagIds.includes(bag.id);
                    const isFull = selectedBagIds.length >= selectedRequest.unitsNeeded && !isSelected;

                    return (
                      <button
                        key={bag.id}
                        onClick={() => toggleBagSelection(bag.id)}
                        disabled={isFull}
                        className={`w-full p-5 rounded-2xl border-2 transition-all flex items-center justify-between ${
                          isSelected 
                            ? 'bg-red-50 border-red-600 ring-4 ring-red-50' 
                            : isFull 
                            ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-100' 
                            : 'bg-white border-slate-100 hover:border-red-200'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${
                            isSelected ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {bag.type}
                          </div>
                          <div className="text-left">
                            <h5 className="font-black text-slate-800 text-xs">UNIT {bag.id}</h5>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Expires: {bag.expiryDate}</p>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-red-600" />}
                      </button>
                    );
                  })}
                  {compatibleBags.length === 0 && (
                    <div className="py-16 text-center">
                      <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Insufficiency</p>
                      <p className="text-xs text-slate-300 font-bold mt-1">No compatible {selectedRequest.bloodType} units found in inventory.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100">
                <button
                  disabled={selectedBagIds.length < selectedRequest.unitsNeeded || isAllocating}
                  onClick={handleAllocate}
                  className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-red-600 transition-all shadow-2xl disabled:opacity-30 flex items-center justify-center gap-3 active:scale-95"
                >
                  {isAllocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Truck className="w-5 h-5" /> Execute Digital Dispatch</>}
                </button>
                <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest mt-4 leading-relaxed">
                  Execution marks units as "Allocated" and locks them for institutional transfer.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-[3rem] border-4 border-dashed border-slate-100">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <ClipboardCheck className="w-12 h-12 text-slate-200" />
              </div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Select Request</h3>
              <p className="text-xs text-slate-400 font-bold mt-2 max-w-xs leading-relaxed">
                Choose a pending emergency request from the queue to start the physical matching and allocation workflow.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BloodAllocation;
