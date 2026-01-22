
export interface GeoCoords {
  latitude: number;
  longitude: number;
  accuracy?: 'high' | 'low' | 'fixed';
}

/**
 * Calculates the distance between two points in KM using the Haversine formula.
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

/**
 * ADAPTIVE GEOLOCATION ENGINE
 * Attempts to acquire high-fidelity signal with progressive timeouts.
 * If all hardware attempts fail, it throws an error to trigger Manual Sector Discovery.
 */
export async function getCurrentPosition(): Promise<GeoCoords> {
  const getPos = (high: boolean, timeout: number): Promise<GeoCoords> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("GEOLOCATION_UNSUPPORTED"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ 
          latitude: p.coords.latitude, 
          longitude: p.coords.longitude,
          accuracy: high ? 'high' : 'low'
        }),
        (e) => {
          const err = new Error(e.message) as any;
          err.code = e.code;
          reject(err);
        },
        { 
          enableHighAccuracy: high, 
          timeout: timeout, 
          maximumAge: 60000 // 1 minute cache
        }
      );
    });
  };

  try {
    // Attempt 1: Fast network lock
    return await getPos(false, 5000); 
  } catch (error: any) {
    // If permission is denied, stop immediately
    if (error.code === 1) throw new Error("PERMISSION_DENIED");
    
    // Attempt 2: More persistent hardware search
    try {
      return await getPos(true, 8000);
    } catch (finalError) {
      // Hardware failure/timeout: Trigger UI fallback
      throw new Error("SATELLITE_LINK_FAILED");
    }
  }
}

export function startLocationWatch(
  onUpdate: (coords: GeoCoords) => void,
  onError: (error: Error) => void
): number {
  if (!navigator.geolocation) return -1;
  return navigator.geolocation.watchPosition(
    (pos) => onUpdate({ 
      latitude: pos.coords.latitude, 
      longitude: pos.coords.longitude,
      accuracy: 'high'
    }),
    (err) => onError(new Error(err.message)),
    { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
  );
}
