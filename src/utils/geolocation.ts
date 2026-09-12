/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GeolocationResult {
  city: string;
  suburb?: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
}

/**
 * Requests genuine browser geolocation with user consent.
 * Strictly NEVER falls back to hardcoded cities (like Kolkata, Delhi, etc.) if denied.
 */
export async function requestGenuineLocation(): Promise<GeolocationResult | null> {
  if (typeof window === "undefined" || !navigator.geolocation) {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          // Reverse geocode via OpenStreetMap Nominatim
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            {
              headers: {
                "Accept-Language": "en",
              },
            }
          );
          if (!res.ok) {
            resolve({
              city: "",
              formattedAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              latitude,
              longitude,
            });
            return;
          }
          const data = await res.json();
          const addr = data.address || {};
          const city =
            addr.city ||
            addr.town ||
            addr.village ||
            addr.municipality ||
            addr.state_district ||
            "";
          const suburb = addr.suburb || addr.neighbourhood || addr.road || "";
          
          let displayLocation = "";
          if (suburb && city) {
            displayLocation = `${suburb}, ${city}`;
          } else if (city) {
            displayLocation = city;
          } else if (suburb) {
            displayLocation = suburb;
          } else {
            displayLocation = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          }

          resolve({
            city: displayLocation,
            suburb,
            formattedAddress: data.display_name || displayLocation,
            latitude,
            longitude,
          });
        } catch (err) {
          console.warn("[Geolocation] Reverse geocoding failed:", err);
          resolve({
            city: "",
            formattedAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            latitude,
            longitude,
          });
        }
      },
      (err) => {
        console.warn("[Geolocation] User denied or device error:", err.message);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
}
