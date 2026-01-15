
import React from 'react';
import { 
  Droplet, 
  CheckCircle2, 
  MapPin, 
  QrCode, 
  ShieldCheck, 
  Download, 
  X, 
  Calendar, 
  Hash, 
  Award, 
  Printer 
} from 'lucide-react';
import { Donor, BloodType } from '../services/types';

interface ReceiptProps {
  donor: Donor;
  receiptId: string;
  date: string;
  units: number;
  hbLevel: number;
  onClose: () => void;
}

const DonationReceipt: React.FC<ReceiptProps> = ({ donor, receiptId, date, units, hbLevel, onClose }) => {
  const nextEligible = new Date();
  nextEligible.setMonth(nextEligible.getMonth() + 3);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-full transition-all z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Receipt Header */}
        <div className="bg-red-600 p-8 text-white relative overflow-hidden">
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4">
              <Droplet className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-black tracking-tight">Donation Receipt</h2>
            <div className="flex items-center gap-1.5 mt-1 bg-white/10 px-3 py-1 rounded-full border border-white/20">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">Verified Blood Bank</span>
            </div>
          </div>
          <ShieldCheck className="absolute -bottom-10 -left-10 w-40 h-40 text-white/5 rotate-12" />
        </div>

        {/* Receipt Content */}
        <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto scrollbar-hide">
          
          {/* Institution & ID */}
          <div className="flex justify-between items-start border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase">LifeCare Blood Center</h3>
              <p className="text-[10px] font-bold text-slate-400">REG NO: TN/BB/2026/045</p>
              <p className="text-[10px] font-medium text-slate-500 flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" /> New Delhi, Central Node
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Receipt ID</p>
              <p className="text-xs font-bold text-slate-700">#{receiptId}</p>
              <p className="text-[10px] font-bold text-slate-400 mt-1">{date}</p>
            </div>
          </div>

          {/* Donor & Clinical Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Donor Details</p>
              <p className="text-sm font-bold text-slate-800">{donor.name}</p>
              <p className="text-xs font-black text-red-600 mt-1">Group: {donor.bloodType}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Clinical Data</p>
              <p className="text-sm font-bold text-slate-800">{units}ml Whole Blood</p>
              <p className="text-[10px] font-bold text-slate-500 mt-1">Hb Level: {hbLevel} g/dL</p>
            </div>
          </div>

          {/* Reward Points */}
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-amber-200">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-amber-600 uppercase">Reward Points</p>
                <p className="text-lg font-black text-amber-800">+1,000 Pts</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold text-amber-700">Next Eligibility</p>
              <p className="text-xs font-black text-amber-900">{nextEligible.toLocaleDateString()}</p>
            </div>
          </div>

          {/* Verification QR */}
          <div className="flex flex-col items-center justify-center py-4 border-t border-dashed border-slate-200">
            <div className="p-3 bg-white border-2 border-slate-100 rounded-2xl shadow-sm mb-3">
              <QrCode className="w-24 h-24 text-slate-800" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Scan to Verify Validity</p>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-6 bg-slate-50 flex gap-3">
          <button 
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl text-xs font-black hover:bg-slate-100 transition-all shadow-sm"
          >
            <Printer className="w-4 h-4" /> PRINT
          </button>
          <button 
            className="flex-1 flex items-center justify-center gap-2 px-4 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
          >
            <Download className="w-4 h-4" /> DOWNLOAD
          </button>
        </div>

        <div className="pb-6 text-center">
           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">❤️ Thank you for saving lives today</p>
        </div>
      </div>
    </div>
  );
};

export default DonationReceipt;
