
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
  CalendarDays
} from 'lucide-react';
import { Donor } from '../services/types';

interface ReceiptProps {
  donor: Partial<Donor>;
  receiptId: string; // This is used as the Blood Bag ID
  date: string;
  expiryDate: string;
  units: number;
  hbLevel: number;
  onClose: () => void;
}

const DonationReceipt: React.FC<ReceiptProps> = ({ donor, receiptId, date, expiryDate, units, hbLevel, onClose }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  
  const nextEligible = new Date();
  nextEligible.setMonth(nextEligible.getMonth() + 3);

  const handleDownload = () => {
    setIsDownloading(true);
    
    // Simulate generation of receipt file
    setTimeout(() => {
      const content = `
RED CONNECT PRO - OFFICIAL DONATION RECEIPT
-------------------------------------------
Blood Bag ID: #${receiptId}
Donation Date: ${date}
Expiry Date: ${expiryDate}
Facility: LifeCare Blood Center

DONOR INFORMATION
Name: ${donor.name}
Blood Group: ${donor.bloodType}

CLINICAL VITAL DATA
Volume: ${units}ml
Hb Level: ${hbLevel} g/dL

REWARDS
Points Earned: +1,000 Pts
Next Eligible Date: ${nextEligible.toLocaleDateString()}

Verified by Red Connect Pro Command Cloud
-------------------------------------------
      `;
      
      const element = document.createElement("a");
      const file = new Blob([content], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = `Donation_Receipt_${receiptId}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      setIsDownloading(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-300 relative border border-slate-100">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2.5 bg-white/20 hover:bg-white/40 text-white rounded-full transition-all z-30 backdrop-blur-md border border-white/20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Receipt Header - High Impact Red */}
        <div className="bg-red-600 p-10 text-white relative overflow-hidden">
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center mb-5 border border-white/30 shadow-2xl">
              <Droplet className="w-10 h-10 text-white fill-white" />
            </div>
            <h2 className="text-3xl font-black tracking-tight uppercase">Donation Receipt</h2>
            <div className="flex items-center gap-2 mt-2 bg-black/20 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Verified Blood Bank</span>
            </div>
          </div>
          {/* Subtle patterns */}
          <ShieldCheck className="absolute -bottom-10 -left-10 w-48 h-48 text-white/5 rotate-12" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        </div>

        {/* Receipt Content */}
        <div className="p-8 space-y-6 max-h-[55vh] overflow-y-auto scrollbar-hide bg-white">
          
          {/* Institution & ID */}
          <div className="flex justify-between items-start border-b border-slate-100 pb-5">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Facility</h3>
              <p className="text-sm font-black text-slate-800">LifeCare Blood Center</p>
              <p className="text-[10px] font-bold text-slate-500 mt-1 flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-red-500" /> New Delhi Node
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Blood Bag ID</p>
              <p className="text-xs font-black text-slate-900">{receiptId}</p>
              <p className="text-[10px] font-bold text-slate-400 mt-1">{date}</p>
            </div>
          </div>

          {/* Donor & Clinical Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Donor</p>
              <p className="text-sm font-black text-slate-800 truncate">{donor.name || 'Anonymous Donor'}</p>
              <p className="text-xs font-black text-red-600 mt-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-red-600 rounded-full"></span> Group: {donor.bloodType}
              </p>
            </div>
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Clinical Data</p>
              <p className="text-sm font-black text-slate-800">{units}ml Whole Blood</p>
              <p className="text-[10px] font-bold text-slate-500 mt-1.5">Hb Level: {hbLevel} g/dL</p>
              <div className="mt-3 pt-3 border-t border-slate-200">
                <p className="text-[9px] font-black text-red-600 uppercase tracking-widest flex items-center gap-1.5">
                  <CalendarDays className="w-3 h-3" /> Expiry: {expiryDate}
                </p>
              </div>
            </div>
          </div>

          {/* Reward Points Box */}
          <div className="bg-amber-50 border border-amber-100 p-5 rounded-[2rem] flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200">
                <Award className="w-7 h-7" />
              </div>
              <div>
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-0.5">Reward Points</p>
                <p className="text-xl font-black text-amber-800">+1,000 Pts</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold text-amber-700 uppercase">Next Eligible</p>
              <p className="text-xs font-black text-amber-900">{nextEligible.toLocaleDateString()}</p>
            </div>
          </div>

          {/* Verification QR Section */}
          <div className="flex flex-col items-center justify-center py-6 border-t border-dashed border-slate-200">
            <div className="p-4 bg-white border-2 border-slate-100 rounded-[2rem] shadow-xl mb-4 group cursor-pointer hover:scale-105 transition-transform">
              <QrCode className="w-28 h-28 text-slate-900" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Scan to Verify Validity</p>
          </div>
        </div>

        {/* Action Footer - Fixed Visibility and Logic */}
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
          <button 
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2.5 px-6 py-5 bg-white border-2 border-slate-200 text-slate-700 rounded-[1.5rem] text-xs font-black hover:bg-slate-100 hover:border-slate-300 transition-all shadow-sm active:scale-95"
          >
            <Printer className="w-5 h-5" /> PRINT
          </button>
          <button 
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-1 flex items-center justify-center gap-2.5 px-6 py-5 bg-slate-900 text-white rounded-[1.5rem] text-xs font-black hover:bg-black transition-all shadow-2xl shadow-slate-300 border border-white/10 active:scale-95 disabled:opacity-70"
          >
            {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            {isDownloading ? 'SAVING...' : 'DOWNLOAD'}
          </button>
        </div>

        <div className="pb-8 text-center">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">❤️ Red Connect Pro Cloud Security</p>
        </div>
      </div>
    </div>
  );
};

export default DonationReceipt;
