
import { BloodType, EmergencyRequest } from './services/types';

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

export const MOCK_DONORS: any[] = [
  { id: 'd1', name: 'Arjun Sharma', age: 28, bloodType: 'O-', lastDonation: '2024-09-15', distance: 1.2, phone: '+91 98765 43210', isAvailable: true, aadhaarVerified: true, unitsDonatedYear: 4, donationCount: 12 },
  { id: 'd2', name: 'Priya Verma', age: 34, bloodType: 'A+', lastDonation: '2024-10-10', distance: 3.5, phone: '+91 87654 32109', isAvailable: true, aadhaarVerified: true, unitsDonatedYear: 3, donationCount: 8 },
  { id: 'd3', name: 'Rahul Nair', age: 22, bloodType: 'B+', lastDonation: '2024-08-22', distance: 0.8, phone: '+91 76543 21098', isAvailable: true, aadhaarVerified: false, unitsDonatedYear: 5, donationCount: 15 },
  { id: 'd4', name: 'Sneha Rao', age: 41, bloodType: 'O+', lastDonation: '2024-10-05', distance: 5.2, phone: '+91 65432 10987', isAvailable: true, aadhaarVerified: true, unitsDonatedYear: 2, donationCount: 5 },
  { id: 'd5', name: 'Vikram Singh', age: 55, bloodType: 'AB-', lastDonation: '2024-07-28', distance: 2.1, phone: '+91 54321 09876', isAvailable: true, aadhaarVerified: false, unitsDonatedYear: 1, donationCount: 22 },
  { id: 'd6', name: 'Zoya Khan', age: 29, bloodType: 'O-', lastDonation: '2024-11-02', distance: 4.1, phone: '+91 91234 56789', isAvailable: true, aadhaarVerified: true, unitsDonatedYear: 6, donationCount: 18 },
  { id: 'd7', name: 'Kabir Das', age: 37, bloodType: 'B-', lastDonation: '2024-06-15', distance: 6.2, phone: '+91 93456 78901', isAvailable: true, aadhaarVerified: true, unitsDonatedYear: 4, donationCount: 9 },
];

export const MOCK_BANKS: any[] = [
  { 
    id: 'b1', 
    name: 'City General Blood Center', 
    inventory: { 'A+': 12, 'A-': 3, 'B+': 8, 'B-': 1, 'AB+': 4, 'AB-': 0, 'O+': 15, 'O-': 2 },
    plateletsCount: 45,
    location: { lat: 28.6139, lng: 77.2090, address: 'Connaught Place, Delhi' },
    source: 'e-Raktkosh',
    lastSync: new Date().toISOString(),
    phone: '011-23456789',
    unitsDispatchedYear: 1240,
    efficiencyRating: 98,
    emergencyResponseCount: 450
  },
  { 
    id: 'b2', 
    name: 'Red Cross Regional Bank', 
    inventory: { 'A+': 5, 'A-': 0, 'B+': 3, 'B-': 0, 'AB+': 2, 'AB-': 1, 'O+': 7, 'O-': 0 },
    plateletsCount: 120,
    location: { lat: 28.5355, lng: 77.3910, address: 'Sector 18, Noida' },
    source: 'WellSky',
    lastSync: new Date().toISOString(),
    phone: '0120-4567890',
    unitsDispatchedYear: 980,
    efficiencyRating: 94,
    emergencyResponseCount: 320
  }
];

export const MOCK_REQUESTS: EmergencyRequest[] = [
  {
    id: 'req1',
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
  },
  {
    id: 'req2',
    patientName: 'Sunita Reddy',
    bloodType: 'B+',
    unitsNeeded: 3,
    hospital: 'Apollo Medical Center (Bangalore)',
    location: 'Room 302',
    urgency: 'High',
    isPlateletRequest: true,
    contact: '+91 88776 65544',
    timestamp: '5 hours ago',
    coordinates: { lat: 12.9716, lng: 77.5946 }
  },
  {
    id: 'req3',
    patientName: 'Rohan Mehta',
    bloodType: 'A-',
    unitsNeeded: 5,
    hospital: 'Metro Life Care (Mumbai)',
    location: 'Surgery Block B',
    urgency: 'Critical',
    isPlateletRequest: false,
    contact: '+91 77665 54433',
    timestamp: 'Just now',
    coordinates: { lat: 19.0760, lng: 72.8777 }
  }
];
