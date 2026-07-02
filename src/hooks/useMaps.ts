/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from "react";
import { mapsService, LocationSuggestion } from "../services/mapsService";

export function useMaps() {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [reverseGeocoding, setReverseGeocoding] = useState(false);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    try {
      const results = await mapsService.getSuggestions(query);
      setSuggestions(results);
    } catch (e) {
      console.error("Failed to load map autocomplete:", e);
    } finally {
      setSearching(false);
    }
  }, []);

  const reverseGeocodeCoords = useCallback(async (lat: number, lng: number): Promise<string> => {
    setReverseGeocoding(true);
    try {
      return await mapsService.reverseGeocode(lat, lng);
    } finally {
      setReverseGeocoding(false);
    }
  }, []);

  return {
    suggestions,
    setSuggestions,
    searching,
    reverseGeocoding,
    fetchSuggestions,
    reverseGeocodeCoords,
    defaultCoords: mapsService.getDefaultCoords(),
  };
}
