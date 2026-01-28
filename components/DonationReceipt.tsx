
import React, { useState } from 'react';
import { 
  Droplet, 
  CheckCircle2, 
  MapPin, 
  QrCode, 
  ShieldCheck, 
  Download, 
  X, 
  Award, 
  Printer,
  Loader2,
  CalendarDays,
  User,
  Heart,
  Signature
} from 'lucide-react';
import { Donor } from '../services/types';

interface ReceiptProps {
  donor: Partial<Donor>;
  receiptId: string;
  date: string;
  expiryDate: string;
  units: number;
  hbLevel: number;
  onClose: () => void;
}

const DonationReceipt: React.FC<ReceiptProps> = ({ donor, receiptId, date, expiryDate, units, hbLevel, onClose }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  
  const nextEligible = new Date(date);
  nextEligible.setMonth(nextEligible.getMonth() + 3);

  const handleDownload = () => {
    setIsDownloading(true);
    setTimeout(() => {
      const content = `
RED COMMAND PRO - OFFICIAL DONATION RECEIPT
-------------------------------------------
Receipt ID: #${receiptId}
Donation Date: ${date}
Expiry Date: ${expiryDate}
Status: VERIFIED

DONOR INFORMATION
Name: ${donor.name}
Blood Group: ${donor.bloodType}

CLINICAL VITAL DATA
Volume: ${units}ml
Hb Level: ${hbLevel} g/dL

REWARDS
Next Eligible Date: ${nextEligible.toLocaleDateString()}
-------------------------------------------
Verified via Red Command State Relay
      `;
      const element = document.createElement("a");
      const file = new Blob([content], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = `Receipt_${receiptId}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      setIsDownloading(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-300 relative border border-slate-100">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2.5 bg-white/20 hover:bg-white/40 text-white rounded-full transition-all z-30 backdrop-blur-md border border-white/20"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="bg-red-600 p-10 text-white relative overflow-hidden">
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center mb-5 border border-white/30 shadow-2xl">
              <Droplet className="w-10 h-10 text-white fill-white" />
            </div>
            <h2 className="text-3xl font-black tracking-tight uppercase leading-none">Donation Receipt</h2>
            <div className="flex items-center gap-2 mt-3 bg-black/20 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Verified Registry Unit</span>
            </div>
          </div>
          <ShieldCheck className="absolute -bottom-10 -left-10 w-48 h-48 text-white/5 rotate-12" />
        </div>

        <div className="p-8 space-y-6 bg-white">
          <div className="flex justify-between items-start border-b border-slate-50 pb-5">
            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Transaction Node</h3>
              <p className="text-sm font-black text-slate-800">State Medical Relay Hub</p>
              <p className="text-[10px] font-bold text-slate-500 mt-1 flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-red-500" /> Unit Tracking: {receiptId}
              </p>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <QrCode className="w-10 h-10 text-slate-800" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Donor Name</h4>
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-xs font-black text-slate-800 uppercase">{donor.name}</p>
                </div>
              </div>
              <div>
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Blood Group</h4>
                <div className="flex items-center gap-2">
                  <Heart className="w-3.5 h-3.5 text-red-500" />
                  <p className="text-sm font-black text-red-600">{donor.bloodType}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Hb Level</h4>
                <p className="text-xs font-black text-slate-800">{hbLevel} g/dL</p>
              </div>
              <div>
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Volume</h4>
                <p className="text-xs font-black text-slate-800">{units} ml</p>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50/50 p-5 rounded-[2rem] border border-indigo-100 relative overflow-hidden">
             <div className="flex justify-between items-center relative z-10">
                <div>
                   <h4 className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-0.5">Next Safe Interval</h4>
                   <p className="text-xs font-bold text-slate-600">{nextEligible.toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                   <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">Social Credits</h4>
                   <p className="text-xs font-black text-slate-800">+1000 PTS</p>
                </div>
             </div>
             <CalendarDays className="absolute -right-4 -bottom-4 w-16 h-16 text-indigo-500/10 -rotate-12" />
          </div>

          <div className="pt-4 flex items-center justify-between">
             <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Registrar Signatory</span>
                <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5 mt-0.5 italic">
                  <Signature className="w-4 h-4 text-indigo-400" /> Dr. S. Ramanathan
                </span>
             </div>
             <ShieldCheck className="w-10 h-10 text-emerald-500 opacity-20" />
          </div>

          <button 
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full mt-4 bg-slate-900 text-white py-5 rounded-[1.75rem] font-black uppercase tracking-[0.2em] text-[11px] hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
          >
            {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Download className="w-5 h-5" /> Export Ledger Certificate</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DonationReceipt;
