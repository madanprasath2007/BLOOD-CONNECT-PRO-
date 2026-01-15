import { Donor, BloodBank, AuthenticatedUser, UserRole, BloodType } from './types';
import { MOCK_DONORS, MOCK_BANKS } from '../constants';
import { broadcastToNetwork } from './networkService';

const DB_KEYS = {
  DONORS: 'redconnect_donor_db',
  BANKS: 'redconnect_bank_db',
  HOSPITALS: 'redconnect_hospital_db',
  REQUESTS: 'redconnect_request_db',
  OTP_STORE: 'redconnect_otp_relay'
};

const DEFAULT_INVENTORY: Record<BloodType, number> = {
  'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'AB+': 0, 'AB-': 0, 'O+': 0, 'O-': 0
};

class BackendService {
  constructor() {
    this.initializeDB();
  }

  private initializeDB() {
    if (!localStorage.getItem(DB_KEYS.DONORS)) {
      localStorage.setItem(DB_KEYS.DONORS, JSON.stringify(MOCK_DONORS));
    }
    if (!localStorage.getItem(DB_KEYS.BANKS)) {
      localStorage.setItem(DB_KEYS.BANKS, JSON.stringify(MOCK_BANKS));
    }
    if (!localStorage.getItem(DB_KEYS.REQUESTS)) {
      localStorage.setItem(DB_KEYS.REQUESTS, JSON.stringify([]));
    }
  }

  async requestOtp(email: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpStore = JSON.parse(localStorage.getItem(DB_KEYS.OTP_STORE) || '{}');
    otpStore[email] = { otp, expires: Date.now() + 300000 };
    localStorage.setItem(DB_KEYS.OTP_STORE, JSON.stringify(otpStore));

    window.dispatchEvent(new CustomEvent('RED_CONNECT_MAIL_INTERCEPT', {
      detail: { email, otp, timestamp: new Date().toLocaleTimeString() }
    }));
    return { success: true, message: 'OTP Sent' };
  }

  async verifyOtp(email: string, otp: string) {
    const otpStore = JSON.parse(localStorage.getItem(DB_KEYS.OTP_STORE) || '{}');
    const record = otpStore[email];
    if (record && record.otp === otp && Date.now() < record.expires) {
      delete otpStore[email];
      localStorage.setItem(DB_KEYS.OTP_STORE, JSON.stringify(otpStore));
      return { success: true };
    }
    return { success: false, message: 'Invalid or expired OTP' };
  }

  getDonors(): Donor[] {
    return JSON.parse(localStorage.getItem(DB_KEYS.DONORS) || '[]');
  }

  saveDonor(donor: Donor) {
    const donors = this.getDonors();
    const updated = [donor, ...donors];
    localStorage.setItem(DB_KEYS.DONORS, JSON.stringify(updated));
    broadcastToNetwork({ type: 'DATA_CHANGE', payload: { entity: 'donors' } });
  }

  deleteDonor(id: string) {
    const donors = this.getDonors().filter(d => d.id !== id);
    localStorage.setItem(DB_KEYS.DONORS, JSON.stringify(donors));
    broadcastToNetwork({ type: 'DATA_CHANGE', payload: { entity: 'donors' } });
  }

  getInstitutions(type: 'BloodBank' | 'Hospital'): any[] {
    const key = type === 'BloodBank' ? DB_KEYS.BANKS : DB_KEYS.HOSPITALS;
    return JSON.parse(localStorage.getItem(key) || '[]');
  }

  saveInstitution(data: any, type: 'BloodBank' | 'Hospital') {
    const key = type === 'BloodBank' ? DB_KEYS.BANKS : DB_KEYS.HOSPITALS;
    const db = this.getInstitutions(type);
    localStorage.setItem(key, JSON.stringify([data, ...db]));
    broadcastToNetwork({ type: 'DATA_CHANGE', payload: { entity: type } });
  }

  getInstitutionProfile(id: string, type: 'BloodBank' | 'Hospital') {
    return this.getInstitutions(type).find(i => i.id === id);
  }

  getEmergencyRequests(): any[] {
    return JSON.parse(localStorage.getItem(DB_KEYS.REQUESTS) || '[]');
  }

  saveEmergencyRequest(request: any) {
    const requests = this.getEmergencyRequests();
    const updated = [request, ...requests];
    localStorage.setItem(DB_KEYS.REQUESTS, JSON.stringify(updated));
    broadcastToNetwork({ type: 'GLOBAL_SOS', payload: { hospitalName: request.hospital, request } });
  }

  async authenticate(email: string, key: string, role: UserRole): Promise<AuthenticatedUser | null> {
    if (role === 'Donor') {
      const user = this.getDonors().find(d => d.email === email && (d as any).password === key);
      if (user) return { id: user.id, name: user.name, email: user.email!, role: 'Donor', avatar: `https://i.pravatar.cc/150?u=${user.id}` };
    } else {
      const inst = this.getInstitutions(role as 'BloodBank' | 'Hospital').find(i => i.email === email && i.accessKey === key);
      if (inst) return { id: inst.id, name: inst.institutionName, email: inst.email, role: role, avatar: `https://i.pravatar.cc/150?u=${inst.id}` };
    }
    return null;
  }
}

export const backendService = new BackendService();
export default backendService;