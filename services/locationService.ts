
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
 * Specifically catches "Permissions Policy" errors to trigger Semantic Discovery.
 */
export async function getCurrentPosition(): Promise<GeoCoords> {
  const getPos = (high: boolean, timeout: number): Promise<GeoCoords> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("GEOLOCATION_UNSUPPORTED"));
        return;
      }
      
      try {
        navigator.geolocation.getCurrentPosition(
          (p) => resolve({ 
            latitude: p.coords.latitude, 
            longitude: p.coords.longitude,
            accuracy: high ? 'high' : 'low'
          }),
          (e) => {
            const msg = e.message.toLowerCase();
            if (msg.includes('policy') || msg.includes('disabled')) {
              reject(new Error("POLICY_RESTRICTED"));
            } else if (e.code === 1) {
              reject(new Error("PERMISSION_DENIED"));
            } else {
              reject(new Error("SIGNAL_TIMEOUT"));
            }
          },
          { 
            enableHighAccuracy: high, 
            timeout: timeout, 
            maximumAge: 60000 // 1 minute cache
          }
        );
      } catch (err: any) {
        const msg = err.message?.toLowerCase() || '';
        if (err.name === 'SecurityError' || msg.includes('policy')) {
          reject(new Error("POLICY_RESTRICTED"));
        } else {
          reject(err);
        }
      }
    });
  };

  try {
    // Stage 1: Fast network triangulation
    return await getPos(false, 3500); 
  } catch (error: any) {
    if (error.message === "POLICY_RESTRICTED" || error.message === "PERMISSION_DENIED") {
      throw error;
    }
    
    // Stage 2: Precision hardware retry
    try {
      return await getPos(true, 6000);
    } catch (finalError: any) {
      if (finalError.message === "POLICY_RESTRICTED") throw finalError;
      throw new Error("SATELLITE_LINK_FAILED");
    }
  }
}

export function startLocationWatch(
  onUpdate: (coords: GeoCoords) => void,
  onError: (error: Error) => void
): number {
  if (!navigator.geolocation) return -1;
  try {
    return navigator.geolocation.watchPosition(
      (pos) => onUpdate({ 
        latitude: pos.coords.latitude, 
        longitude: pos.coords.longitude,
        accuracy: 'high'
      }),
      (err) => {
        const msg = err.message.toLowerCase();
        if (!msg.includes('policy') && !msg.includes('disabled')) {
          onError(new Error(err.message));
        }
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    );
  } catch (e) {
    return -1;
  }
}
