
export interface GeoCoords {
  latitude: number;
  longitude: number;
}

/**
 * Calculates the distance between two points in KM using the Haversine formula.
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return parseFloat(d.toFixed(1));
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Fetches the current GPS coordinates with a robust fallback mechanism.
 * If High Accuracy (GPS) fails or times out, it retries with standard accuracy.
 */
export async function getCurrentPosition(forceLowAccuracy: boolean = false): Promise<GeoCoords> {
  const getPosition = (highAccuracy: boolean): Promise<GeoCoords> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          let message = "An unknown error occurred";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = "Location permission denied. Please enable location access in settings.";
              break;
            case error.POSITION_UNAVAILABLE:
              message = "Location information is currently unavailable.";
              break;
            case error.TIMEOUT:
              message = "Location acquisition timed out.";
              break;
          }
          const err = new Error(message) as any;
          err.code = error.code;
          reject(err);
        },
        { 
          enableHighAccuracy: highAccuracy, 
          timeout: 20000, // Increased to 20s for better reliability
          maximumAge: 10000 // Accept a cached position up to 10s old
        }
      );
    });
  };

  try {
    // Attempt 1: High Accuracy (unless forced low)
    return await getPosition(!forceLowAccuracy);
  } catch (error: any) {
    // If it's a timeout or unavailable error and we haven't tried low accuracy yet, fallback
    if ((error.code === 3 || error.code === 2) && !forceLowAccuracy) {
      console.warn("High accuracy timed out. Falling back to standard location services...");
      return await getPosition(false);
    }
    throw error;
  }
}

/**
 * Starts watching the user's position for real-time updates.
 */
export function startLocationWatch(
  onUpdate: (coords: GeoCoords) => void,
  onError: (error: Error) => void
): number {
  if (!navigator.geolocation) {
    onError(new Error("Geolocation is not supported"));
    return -1;
  }
  return navigator.geolocation.watchPosition(
    (pos) => onUpdate({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
    (err) => {
      // For watch, we stay on standard accuracy if GPS fails
      console.error("Location watch error:", err.message);
      onError(new Error(err.message));
    },
    { 
      enableHighAccuracy: false, // For continuous watch, use standard to save battery/reduce timeouts
      maximumAge: 10000, 
      timeout: 25000 
    }
  );
}
