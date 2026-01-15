
import React, { useState } from 'react';
import { Send, User, Hash, Calendar, Droplets, Activity, ClipboardList, ShieldCheck } from 'lucide-react';
import { BloodType, EmergencyRequest } from '../types';

interface HospitalRequestFormProps {
  onSubmit: (request: Partial<EmergencyRequest>) => void;
  hospitalName: string;
}

const HospitalRequestForm: React.FC<HospitalRequestFormProps> = ({ onSubmit, hospitalName }) => {
  const [formData, setFormData] = useState({
    patientName: '',
    admissionNumber: '',
    dob: '',
    bloodType: 'O+' as BloodType,
    unitsNeeded: 1,
    isPlateletRequest: false,
    urgency: 'Normal' as 'Critical' | 'High' | 'Normal'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API delay
    setTimeout(() => {
      onSubmit(formData);
      setIsSubmitting(false);
      setFormData({
        patientName: '',
        admissionNumber: '',
        dob: '',
        bloodType: 'O+',
        unitsNeeded: 1,
        isPlateletRequest: false,
        urgency: 'Normal'
      });
    }, 1500);
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-600 rounded-xl">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold">New Clinical Request</h2>
          </div>
          <p className="text-slate-400 text-sm font-medium">Verified request for {hospitalName}</p>
        </div>
        <ShieldCheck className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5 rotate-12" />
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Patient Info Group */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Patient Verification</h3>
            
            <div className="group">
              <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Full Patient Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-500 transition-colors" />
                <input 
                  type="text" 
                  required
                  placeholder="John Doe"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all font-medium text-slate-800"
                  value={formData.patientName}
                  onChange={(e) => setFormData({...formData, patientName: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="group">
                <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Admission No.</label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-500 transition-colors" />
                  <input 
                    type="text" 
                    required
                    placeholder="ADM-9821"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all font-medium text-slate-800"
                    value={formData.admissionNumber}
                    onChange={(e) => setFormData({...formData, admissionNumber: e.target.value})}
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Date of Birth</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-500 transition-colors" />
                  <input 
                    type="date" 
                    required
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all font-medium text-slate-800 text-sm"
                    value={formData.dob}
                    onChange={(e) => setFormData({...formData, dob: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Requirement Group */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Requirement Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="group">
                <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Blood Type</label>
                <div className="relative">
                  <Droplets className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-500 transition-colors" />
                  <select 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all font-bold text-slate-800 appearance-none"
                    value={formData.bloodType}
                    onChange={(e) => setFormData({...formData, bloodType: e.target.value as BloodType})}
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="group">
                <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Units Needed</label>
                <input 
                  type="number" 
                  min="1"
                  max="10"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all font-bold text-slate-800"
                  value={formData.unitsNeeded}
                  onChange={(e) => setFormData({...formData, unitsNeeded: parseInt(e.target.value)})}
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-xs font-bold text-slate-500 mb-2 ml-1">Urgency Level</label>
              <div className="flex gap-2">
                {(['Normal', 'High', 'Critical'] as const).map(u => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setFormData({...formData, urgency: u})}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all border-2 ${
                      formData.urgency === u 
                        ? u === 'Critical' ? 'bg-red-600 border-red-600 text-white' : 'bg-slate-900 border-slate-900 text-white'
                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    {u.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex-1">
                <h4 className="text-xs font-bold text-slate-800">Platelet Request</h4>
                <p className="text-[10px] text-slate-500">Toggle if requesting platelets (RDP/SDP)</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({...formData, isPlateletRequest: !formData.isPlateletRequest})}
                className={`w-12 h-6 rounded-full relative transition-colors ${formData.isPlateletRequest ? 'bg-amber-500' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isPlateletRequest ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-red-600 text-white py-5 rounded-2xl font-bold text-sm hover:bg-red-700 transition-all shadow-xl shadow-red-200 flex items-center justify-center gap-2 group disabled:opacity-70"
          >
            {isSubmitting ? (
              <Activity className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                Broadcast Urgent Requirement
              </>
            )}
          </button>
          <p className="mt-4 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            This request will be sent to matched donors and nearest blood banks
          </p>
        </div>
      </form>
    </div>
  );
};

export default HospitalRequestForm;
