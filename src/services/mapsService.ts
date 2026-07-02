/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LocationSuggestion {
  placeName: string;
  placeAddress: string;
  latitude: number;
  longitude: number;
  eLoc?: string;
}

export const mapsService = {
  /**
   * Fetch suggestions for a search query (proxy to MapmyIndia or Nominatim)
   */
  async getSuggestions(query: string): Promise<LocationSuggestion[]> {
    if (!query || !query.trim()) return [];
    try {
      const response = await fetch(`/api/maps/autosuggest?query=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error("Autosuggest fetch failed");
      const data = await response.json();
      return data.suggestedLocations || [];
    } catch (error) {
      console.error("mapsService.getSuggestions error:", error);
      return [];
    }
  },

  /**
   * Reverse geocode coordinates to a human-readable address
   */
  async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const response = await fetch(`/api/maps/revgeocode?lat=${lat}&lng=${lng}`);
      if (!response.ok) throw new Error("Reverse geocode fetch failed");
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return data.results[0].formatted_address || "Unknown Location";
      }
      return "Unknown Location";
    } catch (error) {
      console.error("mapsService.reverseGeocode error:", error);
      return "Unknown Location";
    }
  },

  /**
   * Fallback default coordinates (e.g., Pune / Symbiosis area)
   */
  getDefaultCoords() {
    return {
      lat: 18.5204,
      lng: 73.8567,
    };
  },
};
