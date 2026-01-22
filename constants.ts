
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
    id: 'd-live-1', 
    name: 'Arjun Ramachandran', 
    age: 28, 
    bloodType: 'O-', 
    lastDonation: '2024-11-20', 
    distance: 2.4,
    lat: 13.0827,
    lng: 80.2707,
    phone: '+91 90000 11111', 
    isAvailable: true, 
    idVerified: true, 
    unitsDonatedYear: 4, 
    donationCount: 12, 
    email: 'arjun@donor.com', 
    password: 'password123',
    permanentAddress: 'T Nagar, Chennai, Tamil Nadu 600017',
    createdAt: new Date().toISOString()
  },
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
    id: 'tn-chennai-1', 
    institutionName: 'Apollo Hospitals Greams Road', 
    email: 'apollo.greams@tnhealth.in',
    accessKey: 'apollo123',
    inventory: { 'A+': 120, 'A-': 15, 'B+': 85, 'B-': 12, 'AB+': 45, 'AB-': 8, 'O+': 210, 'O-': 42 },
    plateletsCount: 450,
    location: { lat: 13.0607, lng: 80.2505, address: 'Greams Rd, Thousand Lights, Chennai, Tamil Nadu' },
    source: 'e-Raktkosh',
    lastSync: new Date().toISOString(),
    phone: '044-28293333',
    unitsDispatchedYear: 45000,
    efficiencyRating: 99.8,
    emergencyResponseCount: 3400
  },
  { 
    id: 'tn-chennai-2', 
    institutionName: 'MIOT International Blood Bank', 
    email: 'miot@chennai.in',
    accessKey: 'miot123',
    inventory: { 'A+': 55, 'A-': 12, 'B+': 48, 'B-': 5, 'AB+': 22, 'AB-': 4, 'O+': 80, 'O-': 18 },
    plateletsCount: 180,
    location: { lat: 13.0185, lng: 80.1868, address: 'Mount Poonamallee Rd, Manapakkam, Chennai' },
    source: 'WellSky',
    lastSync: new Date().toISOString(),
    phone: '044-42002288',
    unitsDispatchedYear: 28000,
    efficiencyRating: 98.5,
    emergencyResponseCount: 2100
  },
  { 
    id: 'tn-chennai-3', 
    institutionName: 'RGGGH Model Blood Bank', 
    email: 'gh.chennai@tn.gov.in',
    accessKey: 'gh123',
    inventory: { 'A+': 200, 'A-': 30, 'B+': 150, 'B-': 25, 'AB+': 80, 'AB-': 15, 'O+': 350, 'O-': 65 },
    plateletsCount: 900,
    location: { lat: 13.0805, lng: 80.2764, address: 'EVR Periyar Salai, Opposite Central Railway, Chennai' },
    source: 'e-Raktkosh',
    lastSync: new Date().toISOString(),
    phone: '044-25305000',
    unitsDispatchedYear: 89000,
    efficiencyRating: 99.2,
    emergencyResponseCount: 12500
  },
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
