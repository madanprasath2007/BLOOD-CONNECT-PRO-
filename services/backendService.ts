
import { Donor, BloodBank, AuthenticatedUser, UserRole, BloodType, EmergencyRequest, BloodBag } from './types';
import { MOCK_DONORS, MOCK_BANKS, MOCK_HOSPITALS } from '../constants';
import { broadcastToNetwork } from './networkService';

const DB_KEYS = {
  DONORS: 'redconnect_donor_db',
  BANKS: 'redconnect_bank_db',
  HOSPITALS: 'redconnect_hospital_db',
  REQUESTS: 'redconnect_request_db',
  BAGS: 'redconnect_blood_bags_db',
  OTP_STORE: 'redconnect_otp_relay'
};

class BackendService {
  constructor() {
    this.initializeDB();
  }

  private initializeDB() {
    // 1. Initialize or Repair Donors
    const existingDonorsRaw = localStorage.getItem(DB_KEYS.DONORS);
    let donors = existingDonorsRaw ? JSON.parse(existingDonorsRaw) : [];
    
    MOCK_DONORS.forEach(mock => {
      const index = donors.findIndex((d: any) => d.email === mock.email);
      if (index === -1) {
        donors.push(mock);
      } else if (!donors[index].password) {
        donors[index].password = mock.password;
      }
    });
    localStorage.setItem(DB_KEYS.DONORS, JSON.stringify(donors));

    // 2. Initialize or Repair Institutions (Banks/Hospitals)
    const repairInstitution = (key: string, mocks: any[]) => {
      const existingRaw = localStorage.getItem(key);
      let data = existingRaw ? JSON.parse(existingRaw) : [];
      
      mocks.forEach(mock => {
        const index = data.findIndex((i: any) => i.email === mock.email);
        if (index === -1) {
          data.push(mock);
        } else if (!data[index].accessKey) {
          data[index].accessKey = mock.accessKey;
        }
      });
      localStorage.setItem(key, JSON.stringify(data));
    };

    repairInstitution(DB_KEYS.BANKS, MOCK_BANKS);
    repairInstitution(DB_KEYS.HOSPITALS, MOCK_HOSPITALS);

    if (!localStorage.getItem(DB_KEYS.REQUESTS)) {
      localStorage.setItem(DB_KEYS.REQUESTS, JSON.stringify([]));
    }
    
    if (!localStorage.getItem(DB_KEYS.BAGS)) {
      localStorage.setItem(DB_KEYS.BAGS, JSON.stringify([]));
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
    const newDonor = { ...donor, id: donor.id || `d-${Date.now()}` };
    localStorage.setItem(DB_KEYS.DONORS, JSON.stringify([newDonor, ...donors]));
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
    const newInst = { ...data, id: data.id || `inst-${Date.now()}` };
    localStorage.setItem(key, JSON.stringify([newInst, ...db]));
    broadcastToNetwork({ type: 'DATA_CHANGE', payload: { entity: type } });
  }

  getEmergencyRequests(): EmergencyRequest[] {
    return JSON.parse(localStorage.getItem(DB_KEYS.REQUESTS) || '[]');
  }

  saveEmergencyRequest(request: EmergencyRequest) {
    const requests = this.getEmergencyRequests();
    const newReq = { ...request, status: request.status || 'Pending' };
    const updated = [newReq, ...requests];
    localStorage.setItem(DB_KEYS.REQUESTS, JSON.stringify(updated));
    broadcastToNetwork({ type: 'GLOBAL_SOS', payload: { hospitalName: request.hospital, request: newReq } });
  }

  updateEmergencyRequestStatus(requestId: string, status: EmergencyRequest['status']) {
    const requests = this.getEmergencyRequests();
    const idx = requests.findIndex(r => r.id === requestId);
    if (idx !== -1) {
      requests[idx].status = status;
      localStorage.setItem(DB_KEYS.REQUESTS, JSON.stringify(requests));
      broadcastToNetwork({ type: 'DATA_CHANGE', payload: { entity: 'emergency_requests' } });
      return true;
    }
    return false;
  }

  // Inventory Management
  getBloodBags(): BloodBag[] {
    return JSON.parse(localStorage.getItem(DB_KEYS.BAGS) || '[]');
  }

  saveBloodBag(bag: BloodBag) {
    const bags = this.getBloodBags();
    const newBag = { ...bag, status: bag.status || 'Available' };
    localStorage.setItem(DB_KEYS.BAGS, JSON.stringify([newBag, ...bags]));
    broadcastToNetwork({ type: 'DATA_CHANGE', payload: { entity: 'bags' } });
  }

  removeBloodBag(id: string) {
    const bags = this.getBloodBags().filter(b => b.id !== id);
    localStorage.setItem(DB_KEYS.BAGS, JSON.stringify(bags));
    broadcastToNetwork({ type: 'DATA_CHANGE', payload: { entity: 'bags' } });
  }

  async recordDonation(donorId: string, bankId: string, bloodType: BloodType, units: number, sex: string = 'Male') {
    // 2. Generate specialized Bag ID: BAG-M001 / BAG-F001
    const prefix = sex === 'Female' ? 'BAG-F' : 'BAG-M';
    const bags = this.getBloodBags();
    const count = bags.filter(b => b.id.startsWith(prefix)).length + 1;
    const bagId = `${prefix}${count.toString().padStart(3, '0')}`;

    // 3. Create Blood Unit with Expiry and Collection dates
    const collectionDate = new Date().toISOString().split('T')[0];
    const expiryDate = new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 35 days standard

    // 1. Update Donor Availability
    const donors = this.getDonors();
    const donorIdx = donors.findIndex(d => d.id === donorId);
    if (donorIdx !== -1) {
      donors[donorIdx].isAvailable = false;
      donors[donorIdx].lastDonation = collectionDate;
      donors[donorIdx].donationCount = (donors[donorIdx].donationCount || 0) + 1;
      donors[donorIdx].unitsDonatedYear = (donors[donorIdx].unitsDonatedYear || 0) + 1;
      donors[donorIdx].lastBagId = bagId;         // Track Bag ID
      donors[donorIdx].lastBagExpiry = expiryDate; // Track Expiry Date
      localStorage.setItem(DB_KEYS.DONORS, JSON.stringify(donors));
    }

    const newBag: BloodBag = {
      id: bagId,
      type: bloodType,
      collectionDate: collectionDate,
      expiryDate: expiryDate,
      source: `Donation: ${donorId}`,
      volume: units,
      bankId: bankId,
      status: 'Available'
    };
    this.saveBloodBag(newBag);

    return { success: true, bag: newBag };
  }

  async allocateBlood(requestId: string, bagIds: string[]) {
    // 1. Update Request
    const requests = this.getEmergencyRequests();
    const reqIdx = requests.findIndex(r => r.id === requestId);
    if (reqIdx !== -1) {
      requests[reqIdx].status = 'Allocated';
      requests[reqIdx].allocatedBagIds = bagIds;
      localStorage.setItem(DB_KEYS.REQUESTS, JSON.stringify(requests));
    }

    // 2. Update Bags
    const bags = this.getBloodBags();
    bagIds.forEach(id => {
      const bagIdx = bags.findIndex(b => b.id === id);
      if (bagIdx !== -1) {
        bags[bagIdx].status = 'Allocated';
      }
    });
    localStorage.setItem(DB_KEYS.BAGS, JSON.stringify(bags));

    broadcastToNetwork({ type: 'DATA_CHANGE', payload: { entity: 'allocation' } });
    return { success: true };
  }

  async authenticate(email: string, key: string, role: UserRole): Promise<AuthenticatedUser | null> {
    if (role === 'Donor') {
      const donors = this.getDonors();
      const user = donors.find(d => d.email === email && (d as any).password === key);
      if (user) {
        return { 
          id: user.id, 
          name: user.name, 
          email: user.email!, 
          role: 'Donor', 
          avatar: `https://i.pravatar.cc/150?u=${user.id}` 
        };
      }
    } else {
      const institutions = this.getInstitutions(role as 'BloodBank' | 'Hospital');
      const inst = institutions.find(i => i.email === email && i.accessKey === key);
      if (inst) {
        return { 
          id: inst.id, 
          name: inst.institutionName, 
          email: inst.email, 
          role: role, 
          avatar: `https://i.pravatar.cc/150?u=${inst.id}` 
        };
      }
    }
    return null;
  }
}

export const backendService = new BackendService();
export default backendService;
