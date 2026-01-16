
import { BloodType, EmergencyRequest, Donor } from './services/types';

export const COMPATIBILITY_MATRIX: Record<BloodType, BloodType[]> = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'AB-': ['A-', 'B-', 'AB-', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-']
};

export const MOCK_DONORS: Donor[] = [
  { 
    id: 'd-3', 
    name: 'Madan Prasath G', 
    age: 19, 
    bloodType: 'O+', 
    lastDonation: '2025-12-12', 
    distance: 0,
    lat: 13.0475,
    lng: 80.2824,
    phone: '+91 94433 22110', 
    isAvailable: false, 
    idVerified: true, 
    unitsDonatedYear: 1, 
    donationCount: 1, 
    email: 'madan@donor.com', 
    password: 'password123',
    permanentAddress: 'Anna Nagar, Chennai, Tamil Nadu 600040',
    createdAt: new Date().toISOString(),
    lastBagId: 'BAG-M001',
    lastBagExpiry: '2026-01-16'
  },
  { 
    id: 'd-2', 
    name: 'Priya Verma', 
    age: 34, 
    bloodType: 'A+', 
    lastDonation: '2025-12-12', 
    distance: 69.9,
    lat: 11.0401,
    lng: 77.0315,
    phone: '+91 87654 32109', 
    isAvailable: false, 
    idVerified: true, 
    unitsDonatedYear: 3, 
    donationCount: 8, 
    email: 'priya@donor.com', 
    password: 'password123',
    permanentAddress: 'Select Citywalk, Saket, New Delhi, Delhi 110017',
    lastBagId: 'BAG-F001',
    lastBagExpiry: '2026-01-16'
  }
];

export const MOCK_BANKS: any[] = [
  { 
    id: 'tn-b1', 
    institutionName: 'IRT Perunthurai Medical College Hospital', 
    email: 'irt@tnhealth.gov.in',
    accessKey: 'irt123',
    inventory: { 'A+': 45, 'A-': 8, 'B+': 32, 'B-': 5, 'AB+': 12, 'AB-': 2, 'O+': 55, 'O-': 12 },
    plateletsCount: 120,
    location: { lat: 11.2861, lng: 77.5833, address: 'Kunnathur Rd, Perundurai, Tamil Nadu' },
    source: 'e-Raktkosh',
    lastSync: new Date().toISOString(),
    phone: '04294-220912',
    unitsDispatchedYear: 18450,
    efficiencyRating: 99,
    emergencyResponseCount: 1240
  },
  { 
    id: 'tn-b2', 
    institutionName: 'Kongu Blood Bank', 
    email: 'kongu@erode.in',
    accessKey: 'kongu123',
    inventory: { 'A+': 22, 'A-': 4, 'B+': 18, 'B-': 2, 'AB+': 8, 'AB-': 1, 'O+': 30, 'O-': 5 },
    plateletsCount: 85,
    location: { lat: 11.3410, lng: 77.7172, address: 'Perundurai Road, Erode, Tamil Nadu' },
    source: 'Local',
    lastSync: new Date().toISOString(),
    phone: '0424-2253322',
    unitsDispatchedYear: 12200,
    efficiencyRating: 96,
    emergencyResponseCount: 890
  },
  { 
    id: 'tn-b3', 
    institutionName: 'Tamilnadu Voluntary Blood Bank', 
    email: 'tnvbb@erode.in',
    accessKey: 'vbb123',
    inventory: { 'A+': 65, 'A-': 12, 'B+': 45, 'B-': 7, 'AB+': 15, 'AB-': 4, 'O+': 80, 'O-': 18 },
    plateletsCount: 210,
    location: { lat: 11.3524, lng: 77.7281, address: 'VCTV Road, Erode, Tamil Nadu' },
    source: 'e-Raktkosh',
    lastSync: new Date().toISOString(),
    phone: '0424-2222211',
    unitsDispatchedYear: 24500,
    efficiencyRating: 99,
    emergencyResponseCount: 2100
  },
  { 
    id: 'tn-b4', 
    institutionName: 'Erode Blood Bank', 
    email: 'erode@bb.in',
    accessKey: 'ebb123',
    inventory: { 'A+': 35, 'A-': 5, 'B+': 28, 'B-': 3, 'AB+': 10, 'AB-': 1, 'O+': 45, 'O-': 8 },
    plateletsCount: 95,
    location: { lat: 11.3424, lng: 77.7181, address: 'SKC Road, Erode, Tamil Nadu' },
    source: 'e-Raktkosh',
    lastSync: new Date().toISOString(),
    phone: '0424-2255555',
    unitsDispatchedYear: 15400,
    efficiencyRating: 97,
    emergencyResponseCount: 1100
  },
  { 
    id: 'tn-b5', 
    institutionName: 'Rotary IMA Blood Bank', 
    email: 'rotary@tiruppur.in',
    accessKey: 'rot123',
    inventory: { 'A+': 55, 'A-': 9, 'B+': 40, 'B-': 6, 'AB+': 14, 'AB-': 3, 'O+': 70, 'O-': 15 },
    plateletsCount: 180,
    location: { lat: 11.1085, lng: 77.3411, address: 'Dharapuram Main Rd, Tiruppur, Tamil Nadu' },
    source: 'e-Raktkosh',
    lastSync: new Date().toISOString(),
    phone: '0421-2244455',
    unitsDispatchedYear: 21200,
    efficiencyRating: 98,
    emergencyResponseCount: 1800
  },
  { 
    id: 'tn-b6', 
    institutionName: 'Govt Hospital Blood Bank (Dharapuram)', 
    email: 'dpmgh@tnhealth.in',
    accessKey: 'dpm123',
    inventory: { 'A+': 18, 'A-': 2, 'B+': 15, 'B-': 1, 'AB+': 5, 'AB-': 0, 'O+': 25, 'O-': 4 },
    plateletsCount: 40,
    location: { lat: 10.7335, lng: 77.5255, address: 'Dharapuram, Tamil Nadu' },
    source: 'e-Raktkosh',
    lastSync: new Date().toISOString(),
    phone: '04258-220033',
    unitsDispatchedYear: 8900,
    efficiencyRating: 94,
    emergencyResponseCount: 650
  },
  { 
    id: 'tn-b7', 
    institutionName: 'Govt Hospital Blood Bank (Mettupalayam)', 
    email: 'mtpgh@tnhealth.in',
    accessKey: 'mtp123',
    inventory: { 'A+': 25, 'A-': 3, 'B+': 20, 'B-': 2, 'AB+': 8, 'AB-': 1, 'O+': 35, 'O-': 6 },
    plateletsCount: 65,
    location: { lat: 11.3005, lng: 76.9405, address: 'Mettupalayam, Tamil Nadu' },
    source: 'e-Raktkosh',
    lastSync: new Date().toISOString(),
    phone: '04254-222222',
    unitsDispatchedYear: 11500,
    efficiencyRating: 95,
    emergencyResponseCount: 920
  }
];

export const MOCK_HOSPITALS: any[] = [
  {
    id: 'h-1',
    institutionName: 'Metro Life Care',
    email: 'er@metrolife.com',
    accessKey: 'hosp123',
    location: { lat: 19.0760, lng: 72.8777, address: 'Surgery Block B, Mumbai' },
    phone: '+91 77665 54433'
  }
];

export const MOCK_REQUESTS: EmergencyRequest[] = [
  {
    id: 'req-1',
    patientName: 'Amit Patel',
    bloodType: 'O-',
    unitsNeeded: 2,
    hospital: 'City General Hospital (Delhi)',
    location: 'ICU Ward 4',
    urgency: 'Critical',
    isPlateletRequest: false,
    contact: '+91 99887 76655',
    timestamp: '2 hours ago',
    coordinates: { lat: 28.6139, lng: 77.2090 }
  }
];
