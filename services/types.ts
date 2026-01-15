
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type UserRole = 'Donor' | 'BloodBank' | 'Hospital';

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface Donor {
  id: string;
  name: string;
  age: number;
  bloodType: BloodType;
  lastDonation: string;
  distance: number; // in km
  phone: string;
  isAvailable: boolean;
  medicalHistory?: string;
  lastHealthCheck?: string;
  idNumber?: string;
  idVerified?: boolean;
  profilePicture?: string; // base64 or URL
  unitsDonatedYear?: number; // Total units in last 12 months
  donationCount?: number;     // Total career donations
  permanentAddress?: string;
  email?: string;
  password?: string;
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface BloodBank {
  id: string;
  name: string;
  inventory: Record<BloodType, number>;
  plateletsCount: number;
  location: Location;
  source: 'e-Raktkosh' | 'WellSky' | 'UBLOOD' | 'Local';
  lastSync: string;
  phone: string;
}

export interface BloodDrive {
  id: string;
  title: string;
  organizer: string;
  date: string;
  location: string;
  description: string;
  coordinates: { lat: number; lng: number };
}

export interface EmergencyRequest {
  id: string;
  patientName: string;
  admissionNumber?: string;
  dob?: string;
  bloodType: BloodType;
  unitsNeeded: number;
  location: string;
  hospital: string;
  urgency: 'Critical' | 'High' | 'Normal';
  isPlateletRequest: boolean;
  contact: string;
  timestamp: string;
  coordinates?: { lat: number; lng: number };
}

export interface AIRecommendation {
  donorId: string;
  reason: string;
  priorityScore: number;
}
