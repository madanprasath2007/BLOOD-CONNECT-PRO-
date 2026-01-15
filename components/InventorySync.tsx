
import React, { useState, useEffect } from 'react';
import { RefreshCw, Database, CheckCircle, Clock } from 'lucide-react';

const InventorySync: React.FC = () => {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString());
  const [sources, setSources] = useState([
    { name: 'e-Raktkosh', status: 'connected' },
    { name: 'WellSky', status: 'connected' },
    { name: 'UBLOOD', status: 'connected' },
  ]);

  const triggerSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setLastSync(new Date().toLocaleTimeString());
    }, 2500);
  };

  useEffect(() => {
    const interval = setInterval(triggerSync, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-red-600" />
          <h3 className="font-semibold text-slate-800 uppercase tracking-wider text-xs">Live Inventory Sync</h3>
        </div>
        <button 
          onClick={triggerSync}
          className={`text-slate-500 hover:text-red-600 transition-colors ${syncing ? 'animate-spin' : ''}`}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {sources.map(s => (
          <div key={s.name} className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-1 mb-1">
              <div className={`w-2 h-2 rounded-full ${syncing ? 'bg-amber-400' : 'bg-emerald-500'}`}></div>
              <span className="text-[10px] font-bold text-slate-600">{s.name}</span>
            </div>
            <span className="text-[8px] text-slate-400 uppercase tracking-tighter">
              {syncing ? 'Fetching...' : 'Live'}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-slate-500 font-medium">
        <Clock className="w-3 h-3" />
        <span>Last integrated update: {lastSync}</span>
      </div>
    </div>
  );
};

export default InventorySync;
