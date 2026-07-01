import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";

interface InteractiveMapProps {
  lat?: number;
  lng?: number;
  onChange: (lat: number, lng: number) => void;
  onAddressChange?: (address: string) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  lat,
  lng,
  onChange,
  onAddressChange,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // MapmyIndia static API Key
  const apiKey = "gotklovuwdujpswuvxrfqwrecuoqfnycpqpy";

  // Reverse geocoding using MapmyIndia API
  const reverseGeocode = async (newLat: number, newLng: number) => {
    if (!onAddressChange) return;
    try {
      const response = await fetch(
        `https://apis.mappls.com/advancedmaps/v1/${apiKey}/rev_geocode?lat=${newLat}&lng=${newLng}`
      );
      const data = await response.json();
      if (data && data.results && data.results.length > 0) {
        const result = data.results[0];
        const addressText =
          result.formatted_address ||
          result.formattedAddress ||
          [
            result.poi,
            result.street,
            result.subLocality,
            result.locality,
            result.district,
            result.state,
          ]
            .filter(Boolean)
            .join(", ");
        if (addressText) {
          onAddressChange(addressText);
        }
      }
    } catch (error) {
      console.error("MapmyIndia Reverse Geocoding Error:", error);
    }
  };

  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapContainerRef.current) return;

    // Default view coordinates (Wagholi, Pune)
    const defaultLat = 18.5793;
    const defaultLng = 73.9850;
    const initialLat = lat || defaultLat;
    const initialLng = lng || defaultLng;
    const initialZoom = lat && lng ? 16 : 12;

    // Initialize Map
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([initialLat, initialLng], initialZoom);

    mapRef.current = map;

    // CartoDB Dark Matter fits slate theme perfectly
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map);

    // Custom Red Pin divIcon
    const redPinIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 bg-rose-500/30 rounded-full animate-ping"></div>
          <div class="w-4 h-4 bg-rose-500 rounded-full border-2 border-[#020817] shadow-lg"></div>
        </div>
      `,
      className: "custom-leaflet-marker",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const updateMarkerPosition = (newLat: number, newLng: number, skipGeocode = false) => {
      onChange(newLat, newLng);
      if (markerRef.current) {
        markerRef.current.setLatLng([newLat, newLng]);
      } else {
        const marker = L.marker([newLat, newLng], { icon: redPinIcon, draggable: true }).addTo(map);
        marker.on("dragend", (event: any) => {
          const m = event.target;
          const position = m.getLatLng();
          onChange(position.lat, position.lng);
          reverseGeocode(position.lat, position.lng);
        });
        markerRef.current = marker;
      }
      if (!skipGeocode) {
        reverseGeocode(newLat, newLng);
      }
    };

    // Add Marker if lat/lng are provided, and make it draggable
    if (lat && lng) {
      const marker = L.marker([lat, lng], { icon: redPinIcon, draggable: true }).addTo(map);
      marker.on("dragend", (event: any) => {
        const m = event.target;
        const position = m.getLatLng();
        onChange(position.lat, position.lng);
        reverseGeocode(position.lat, position.lng);
      });
      markerRef.current = marker;
    } else {
      // If lat/lng not provided, use default
      updateMarkerPosition(initialLat, initialLng, true);
    }

    // Try to get user browser geolocation if coordinates are not set
    if (!lat && !lng && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          if (mapRef.current) {
            mapRef.current.flyTo([userLat, userLng], 16);
            updateMarkerPosition(userLat, userLng);
          }
        },
        (error) => {
          console.log("Geolocation error or declined:", error);
        }
      );
    }

    // Click handler to drop pin
    map.on("click", (e: any) => {
      const clickedLat = e.latlng.lat;
      const clickedLng = e.latlng.lng;
      updateMarkerPosition(clickedLat, clickedLng);
    });

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Update marker position if coordinates change externally (like AI fill or search click)
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapRef.current || lat === undefined || lng === undefined) return;

    // Verify if marker is at correct position, if not, update
    if (markerRef.current) {
      const curLatLng = markerRef.current.getLatLng();
      if (Math.abs(curLatLng.lat - lat) > 0.0001 || Math.abs(curLatLng.lng - lng) > 0.0001) {
        markerRef.current.setLatLng([lat, lng]);
        mapRef.current.setView([lat, lng], 16);
      }
    } else {
      const redPinIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-8 h-8 bg-rose-500/30 rounded-full animate-ping"></div>
            <div class="w-4 h-4 bg-rose-500 rounded-full border-2 border-[#020817] shadow-lg"></div>
          </div>
        `,
        className: "custom-leaflet-marker",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      const marker = L.marker([lat, lng], { icon: redPinIcon, draggable: true }).addTo(mapRef.current);
      marker.on("dragend", (event: any) => {
        const m = event.target;
        const position = m.getLatLng();
        onChange(position.lat, position.lng);
        reverseGeocode(position.lat, position.lng);
      });
      markerRef.current = marker;
      mapRef.current.setView([lat, lng], 16);
    }
  }, [lat, lng]);

  // Handle Mappls Autocomplete search submission
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const response = await fetch(
        `https://apis.mappls.com/advancedmaps/v1/${apiKey}/autoSuggest?query=${encodeURIComponent(
          searchQuery
        )}`
      );
      const data = await response.json();
      if (data && data.suggestedLocations) {
        setSearchResults(data.suggestedLocations);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error("MapmyIndia AutoSuggest Error:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  // Selected autoSuggest result from drop-down
  const handleSelectResult = (result: any) => {
    const rLat =
      result.latitude !== undefined
        ? parseFloat(result.latitude)
        : result.lat !== undefined
        ? parseFloat(result.lat)
        : null;
    const rLng =
      result.longitude !== undefined
        ? parseFloat(result.longitude)
        : result.lng !== undefined
        ? parseFloat(result.lng)
        : null;

    if (rLat !== null && rLng !== null && !isNaN(rLat) && !isNaN(rLng)) {
      onChange(rLat, rLng);
      if (mapRef.current) {
        mapRef.current.flyTo([rLat, rLng], 17); // Smooth flyTo with zoom level 16-17
      }
      const displayName = result.placeName || result.formatted_address || result.placeAddress;
      const fullAddress = result.placeAddress || result.formatted_address || displayName;
      setSearchQuery(displayName);
      if (onAddressChange) {
        onAddressChange(fullAddress);
      }
      setSearchResults([]);
    } else {
      console.warn("Coordinate missing in Mappls suggestion item:", result);
    }
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-900 shadow-2xl bg-slate-950">
      {/* MapmyIndia Search Input Overlay */}
      <form onSubmit={handleSearch} className="absolute top-2 left-2 right-2 z-[1000] flex gap-1.5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
          <input
            type="text"
            placeholder="Search local landmark, college, village, city (MapmyIndia)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 shadow-lg backdrop-blur-md"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSearchResults([]);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 hover:text-slate-300 font-bold"
            >
              Clear
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={searchLoading}
          className="px-3.5 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-slate-950 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-lg"
        >
          {searchLoading ? <Loader2 className="animate-spin" size={13} /> : "Search"}
        </button>
      </form>

      {/* MapmyIndia Search Results Autocomplete Dropdown List */}
      {searchResults.length > 0 && (
        <div className="absolute top-12 left-2 right-2 z-[1000] max-h-48 overflow-y-auto bg-slate-950/95 border border-slate-800 rounded-xl shadow-2xl backdrop-blur-md divide-y divide-slate-900/60 scrollbar-thin">
          {searchResults.map((result, index) => {
            const name = result.placeName || "Location";
            const addr = result.placeAddress || result.formatted_address || "";
            return (
              <button
                key={result.eLoc || index}
                type="button"
                onClick={() => handleSelectResult(result)}
                className="w-full text-left px-4 py-3 hover:bg-slate-900/80 transition duration-150 block truncate"
              >
                <div className="text-[11px] text-slate-200 font-bold flex items-center gap-1">
                  📍 {name}
                </div>
                {addr && (
                  <div className="text-[9px] text-slate-500 pl-4 mt-0.5 font-medium truncate">
                    {addr}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Leaflet map container */}
      <div ref={mapContainerRef} className="w-full h-[260px] md:h-[300px] outline-none z-0" />
      {lat && lng && (
        <div className="absolute bottom-2 left-2 z-[1000] bg-slate-950/90 border border-slate-900 rounded-lg px-2.5 py-1 text-[10px] text-rose-400 font-mono shadow-md backdrop-blur-md">
          📌 {lat.toFixed(5)}, {lng.toFixed(5)}
        </div>
      )}
    </div>
  );
};

interface MiniMapProps {
  lat: number;
  lng: number;
  address?: string;
}

export const MiniMap: React.FC<MiniMapProps> = ({ lat, lng }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapContainerRef.current) return;

    // Initialize Map with minimal options to make it clean & non-interactive
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      dragging: false,
      touchZoom: false,
    }).setView([lat, lng], 15);

    mapRef.current = map;

    // Dark Matter tiles for premium look
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "",
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map);

    // Beautiful Pin
    const pinIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-6 h-6 bg-cyan-500/20 rounded-full animate-pulse"></div>
          <div class="w-3.5 h-3.5 bg-cyan-400 rounded-full border-2 border-[#020817] shadow-lg"></div>
        </div>
      `,
      className: "custom-mini-marker",
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    L.marker([lat, lng], { icon: pinIcon }).addTo(map);

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lat, lng]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-900 shadow-md bg-slate-950">
      <div ref={mapContainerRef} className="w-full h-[150px] outline-none z-0" />
      <div className="absolute bottom-1.5 right-1.5 z-[1000] bg-slate-950/80 px-2 py-0.5 rounded text-[8px] text-slate-500 font-mono">
        © OpenStreetMap / MapmyIndia
      </div>
    </div>
  );
};
