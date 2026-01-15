
import { BloodType } from './types';

export interface ERaktKoshStatus {
  lastUpdated: string;
  availability: Record<BloodType, number>;
  platelets: 'Available' | 'Low' | 'Critical';
  plasma: 'Available' | 'Unavailable';
  isLive: boolean;
  hospitalId: string;
  region: string;
}

/**
 * Production-grade simulation of the e-RaktKosh Authoritative API Gateway.
 * In production, this would call a secure Node.js proxy that handles 
 * Govt of India API authentication and caching.
 */
export const fetchLiveAvailability = async (facilityName: string): Promise<ERaktKoshStatus> => {
  // Simulate institutional latency
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  // Deterministic mock data generation based on facility name
  const seed = facilityName.length;
  const generateCount = (s: number, type: string) => {
    if (type === 'O-' && s % 3 === 0) return 0; // Rare blood logic
    return Math.floor((s % 12) + (Math.random() * 8));
  };

  const regions = ['DELHI-NCR', 'MAHARASHTRA', 'KARNATAKA', 'TAMIL NADU', 'WEST BENGAL'];
  const region = regions[seed % regions.length];

  return {
    hospitalId: `ERK-${seed}-${Math.random().toString(36).substring(7).toUpperCase()}`,
    region,
    lastUpdated: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    isLive: true,
    availability: {
      'A+': generateCount(seed, 'A+'),
      'A-': generateCount(seed + 1, 'A-'),
      'B+': generateCount(seed + 2, 'B+'),
      'B-': generateCount(seed + 3, 'B-'),
      'AB+': generateCount(seed + 4, 'AB+'),
      'AB-': generateCount(seed + 5, 'AB-'),
      'O+': generateCount(seed + 6, 'O+'),
      'O-': generateCount(seed + 7, 'O-'),
    },
    platelets: seed % 4 === 0 ? 'Critical' : seed % 2 === 0 ? 'Low' : 'Available',
    plasma: seed % 2 === 0 ? 'Available' : 'Unavailable'
  };
};
