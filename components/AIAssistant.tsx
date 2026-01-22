
import React, { useEffect, useState } from 'react';
import { Sparkles, X, Phone, CheckCircle, ShieldAlert, Loader2, UserCheck, ChevronRight } from 'lucide-react';
import { EmergencyRequest, AIRecommendation, Donor } from '../services/types';
import { matchDonors, getHealthGuidelines } from '../services/geminiService';
import { backendService } from '../services/backendService';
import { broadcastToNetwork } from '../services/networkService';
import { MOCK_DONORS } from '../constants';

interface AIProps {
  request: EmergencyRequest | null;
  onClose: () => void;
}

const AIAssistant: React.FC<AIProps> = ({ request, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [guidelines, setGuidelines] = useState('');

  useEffect(() => {
    if (request) {
      setLoading(true);
      Promise.all([
        matchDonors(request, MOCK_DONORS),
        getHealthGuidelines(request.isPlateletRequest)
      ]).then(([recs, guide]) => {
        setRecommendations(recs);
        setGuidelines(guide);
        setLoading(false);
      });
    }
  }, [request]);

  const handleConfirmMatch = async (donorId: string) => {
    if (!request) return;
    setConfirmingId(donorId);
    
    // Simulate clinical validation delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Core logic: Update status to Allocated
    backendService.updateEmergencyRequestStatus(request.id, 'Allocated');
    
    // Ensure network broadast is triggered (Service does this, but we force refresh)
    broadcastToNetwork({ type: 'DATA_CHANGE', payload: { entity: 'emergency_requests' } });
    
    setConfirmingId(null);
    onClose();
  };

  if (!request) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all">
      <div className="glass w-full max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-600 rounded-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Red Connect AI</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gemini 3 Pro Matchmaking</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
              <p className="font-semibold text-sm">Analyzing live requests and donor availability...</p>
              <p className="text-xs text-slate-400 mt-1">Cross-referencing compatibility & proximity matrices</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Guidelines */}
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex gap-3 items-start">
                <ShieldAlert className="w-5 h-5 text-indigo-600 mt-1 flex-shrink-0" />
                <div className="text-xs text-indigo-900 leading-relaxed font-medium">
                  {guidelines}
                </div>
              </div>

              {/* Recommendations */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Top Compatible Donors</h3>
                  <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-full">AI Sorted</span>
                </div>
                
                {recommendations.map((rec, idx) => {
                  const donor = MOCK_DONORS.find(d => d.id === rec.donorId);
                  if (!donor) return null;
                  const isConfirming = confirmingId === donor.id;

                  return (
                    <div key={rec.donorId} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-indigo-300 transition-all group">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex gap-4 flex-1">
                          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex flex-col items-center justify-center text-slate-700 font-black text-xl border-2 border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 group-hover:text-indigo-600 transition-colors">
                            {donor.bloodType}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight">{donor.name}</h4>
                              <div className="bg-indigo-100 text-indigo-700 text-[9px] px-2 py-0.5 rounded-full font-black">
                                {rec.priorityScore}% MATCH
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
                              {donor.distance} km away • {rec.reason}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <a 
                            href={`tel:${donor.phone}`} 
                            className="p-3.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-95"
                            title="Contact Donor"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                          <button 
                            onClick={() => handleConfirmMatch(donor.id)}
                            disabled={!!confirmingId}
                            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.15em] hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95 disabled:opacity-50 min-w-[140px]`}
                          >
                            {isConfirming ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <UserCheck className="w-4 h-4" />
                                Confirm Match
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <button 
                  onClick={onClose}
                  className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2"
                >
                  Dismiss Assistant
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
