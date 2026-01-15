
import React, { useState, useMemo } from 'react';
import { 
  Save, 
  RefreshCcw, 
  AlertTriangle, 
  Droplet, 
  Plus, 
  Trash2, 
  History, 
  ShieldCheck, 
  Calendar, 
  MapPin, 
  Hash, 
  X,
  ClipboardList,
  ChevronRight,
  Search,
  CheckCircle2
} from 'lucide-react';
import { BloodType } from '../services/types';

interface BloodBag {
  id: string;
  type: BloodType | 'Platelets';
  expiryDate: string;
  collectionDate: string;
  source: string;
  volume: number; // in ml
}

interface StockManagementProps {
  bankName: string;
  initialInventory: Record<BloodType, number>;
  initialPlatelets: number;
}

const StockManagement: React.FC<StockManagementProps> = ({ bankName, initialInventory, initialPlatelets }) => {
  // Initialize mock bags based on aggregate counts
  const generateInitialBags = () => {
    const bags: BloodBag[] = [];
    const types = Object.keys(initialInventory) as BloodType[];
    
    types.forEach(type => {
      for (let i = 0; i < initialInventory[type]; i++) {
        const collected = new Date();
        collected.setDate(collected.getDate() - Math.floor(Math.random() * 20));
        const expiry = new Date(collected);
        expiry.setDate(expiry.getDate() + 35); // Whole blood 35 days
        
        bags.push({
          id: `BAG-${type}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
          type,
          collectionDate: collected.toISOString().split('T')[0],
          expiryDate: expiry.toISOString().split('T')[0],
          source: i % 2 === 0 ? 'Internal Drive' : 'City Regional Sync',
          volume: 350
        });
      }
    });

    for (let i = 0; i < initialPlatelets; i++) {
      const collected = new Date();
      collected.setDate(collected.getDate() - Math.floor(Math.random() * 3));
      const expiry = new Date(collected);
      expiry.setDate(expiry.getDate() + 5); // Platelets 5 days
      
      bags.push({
        id: `PLT-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        type: 'Platelets',
        collectionDate: collected.toISOString().split('T')[0],
        expiryDate: expiry.toISOString().split('T')[0],
        source: 'Apheresis Unit 1',
        volume: 250
      });
    }
    return bags;
  };

  const [bags, setBags] = useState<BloodBag[]>(generateInitialBags());
  const [isSaving, setIsSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());
  const [isRegistering, setIsRegistering] = useState<BloodType | 'Platelets' | null>(null);
  const [viewMode, setViewMode] = useState<'aggregate' | 'ledger'>('aggregate');

  // Modal Form State
  const [newBagData, setNewBagData] = useState({
    id: '',
    source: 'Internal Collection',
    expiryDate: '',
    collectionDate: new Date().toISOString().split('T')[0]
  });

  const aggregateCounts = useMemo(() => {
    const counts: Record<string, number> = { 'Platelets': 0 };
    ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].forEach(t => counts[t] = 0);
    
    bags.forEach(bag => {
      counts[bag.type] = (counts[bag.type] || 0) + 1;
    });
    return counts;
  }, [bags]);

  const handleRegisterBag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isRegistering) return;

    const newBag: BloodBag = {
      id: newBagData.id || `UNIT-${Date.now().toString().slice(-6)}`,
      type: isRegistering,
      collectionDate: newBagData.collectionDate,
      expiryDate: newBagData.expiryDate,
      source: newBagData.source,
      volume: isRegistering === 'Platelets' ? 250 : 350
    };

    setBags(prev => [newBag, ...prev]);
    setIsRegistering(null);
    setNewBagData({ id: '', source: 'Internal Collection', expiryDate: '', collectionDate: new Date().toISOString().split('T')[0] });
  };

  const removeBag = (id: string) => {
    if (window.confirm("Confirm unit de-registration? This will permanently remove the bag from active inventory.")) {
      setBags(prev => prev.filter(b => b.id !== id));
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setLastUpdated(new Date().toLocaleTimeString());
    }, 1200);
  };

  const getDaysRemaining = (expiry: string) => {
    const diff = new Date(expiry).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-200">
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-600 rounded-2xl shadow-lg shadow-red-900/40">
                <Droplet className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight">{bankName}</h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Institutional Inventory Control</p>
              </div>
            </div>
            
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
              <button 
                onClick={() => setViewMode('aggregate')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'aggregate' ? 'bg-white text-slate-900' : 'text-slate-400'}`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => setViewMode('ledger')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'ledger' ? 'bg-white text-slate-900' : 'text-slate-400'}`}
              >
                Unit Ledger
              </button>
            </div>
          </div>

          {viewMode === 'aggregate' ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-in fade-in duration-300">
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((type) => (
                <div key={type} className={`p-5 rounded-3xl border transition-all ${aggregateCounts[type] < 5 ? 'bg-red-500/10 border-red-500/30 ring-2 ring-red-500/20' : 'bg-white/5 border-white/10'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-sm font-black text-slate-300">{type}</span>
                    {aggregateCounts[type] < 5 && <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-pulse" />}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-4xl font-black">{aggregateCounts[type]}</span>
                    <button 
                      onClick={() => setIsRegistering(type as BloodType)}
                      className="p-2 bg-white/10 hover:bg-red-600 rounded-xl transition-all group"
                    >
                      <Plus className="w-4 h-4 text-white group-hover:scale-110" />
                    </button>
                  </div>
                  <div className="mt-4 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${aggregateCounts[type] < 5 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                      style={{width: `${Math.min(100, aggregateCounts[type] * 5)}%`}}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden animate-in slide-in-from-right-4 duration-300">
              <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                <table className="w-full text-left text-xs font-bold">
                  <thead className="sticky top-0 bg-slate-800 text-slate-400 uppercase tracking-widest text-[9px] z-20">
                    <tr>
                      <th className="px-6 py-4">Unit ID</th>
                      <th className="px-6 py-4">Group</th>
                      <th className="px-6 py-4">Source</th>
                      <th className="px-6 py-4">Expiry</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {bags.map(bag => {
                      const days = getDaysRemaining(bag.expiryDate);
                      return (
                        <tr key={bag.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-black text-slate-200">{bag.id}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-lg border ${bag.type === 'Platelets' ? 'border-amber-500/30 text-amber-500' : 'border-red-500/30 text-red-500'}`}>
                              {bag.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400">{bag.source}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className={days < 5 ? 'text-red-400' : days < 10 ? 'text-amber-400' : 'text-emerald-400'}>
                                {bag.expiryDate}
                              </span>
                              <span className="text-[8px] opacity-50 uppercase">{days} Days left</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => removeBag(bag.id)}
                              className="p-1.5 hover:bg-red-500/20 text-slate-500 hover:text-red-500 rounded-lg transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-6 p-6 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500">
                <History className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-lg">Platelets (SDP/RDP)</h4>
                <p className="text-slate-400 text-xs font-medium">Critical Dengue Supply • Short Shelf Life</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
               <span className="text-4xl font-black text-amber-500">{aggregateCounts['Platelets']}</span>
               <button 
                onClick={() => setIsRegistering('Platelets')}
                className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center hover:bg-amber-700 shadow-lg shadow-amber-900/40 transition-all active:scale-95"
               >
                 <Plus className="w-5 h-5 text-white" />
               </button>
            </div>
          </div>
        </div>
        <Droplet className="absolute -bottom-10 -left-10 w-64 h-64 text-white/5 rotate-45" />
      </div>

      <div className="flex gap-4">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 bg-red-600 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 hover:bg-red-700 transition-all shadow-xl shadow-red-200 disabled:opacity-70"
        >
          {isSaving ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Commit Updates to e-Raktkosh Network</>}
        </button>
        <button className="px-8 bg-white border border-slate-200 rounded-2xl text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">
          Audit Log
        </button>
      </div>

      {/* Bag Registration Modal */}
      {isRegistering && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-slate-900 p-8 text-white relative">
              <div className="relative z-10 flex items-center gap-3">
                <div className="p-2.5 bg-red-600 rounded-xl">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight uppercase">Register Unit: {isRegistering}</h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Digital Asset Tagging</p>
                </div>
              </div>
              <button 
                onClick={() => setIsRegistering(null)}
                className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleRegisterBag} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unique Bag ID</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="e.g. BAG-X021"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      value={newBagData.id}
                      onChange={e => setNewBagData({...newBagData, id: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Donation Source</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="e.g. Internal Drive"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      value={newBagData.source}
                      onChange={e => setNewBagData({...newBagData, source: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Collection Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="date" 
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      value={newBagData.collectionDate}
                      onChange={e => {
                        const collected = new Date(e.target.value);
                        const exp = new Date(collected);
                        exp.setDate(exp.getDate() + (isRegistering === 'Platelets' ? 5 : 35));
                        setNewBagData({
                          ...newBagData, 
                          collectionDate: e.target.value,
                          expiryDate: exp.toISOString().split('T')[0]
                        });
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Expiry Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="date" 
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      value={newBagData.expiryDate}
                      onChange={e => setNewBagData({...newBagData, expiryDate: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group"
                >
                  Confirm Entry
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-[2.5rem] flex items-start gap-4 shadow-sm">
        <div className="w-10 h-10 bg-emerald-600 text-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-100">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-1">Institutional Compliance Active</h4>
          <p className="text-[11px] text-emerald-700 font-medium leading-relaxed">
            Every unit registered in this ledger is cryptographically linked to your medical license. Any manual adjustment is logged for clinical audit. Cross-match every bag physical tag with its digital twin before dispatch.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StockManagement;
