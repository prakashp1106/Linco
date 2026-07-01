import React, { useEffect, useRef } from "react";

interface InteractiveMapProps {
  lat?: number;
  lng?: number;
  onChange: (lat: number, lng: number) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ lat, lng, onChange }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapContainerRef.current) return;

    // Default view coordinates (India)
    const defaultLat = 20.5937;
    const defaultLng = 78.9629;
    const initialLat = lat || defaultLat;
    const initialLng = lng || defaultLng;
    const initialZoom = lat && lng ? 14 : 5;

    // Initialize Map
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([initialLat, initialLng], initialZoom);

    mapRef.current = map;

    // Add Dark Mode OSM tiles or standard OSM tiles that fit our Slate UI
    // CartoDB Dark Matter fits our dark slate premium look beautifully!
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    // Custom Red Pin divIcon
    const redPinIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 bg-cyan-500/30 rounded-full animate-ping"></div>
          <div class="w-4 h-4 bg-cyan-400 rounded-full border-2 border-[#020817] shadow-lg"></div>
        </div>
      `,
      className: 'custom-leaflet-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    // Add Marker if lat/lng are provided
    if (lat && lng) {
      const marker = L.marker([lat, lng], { icon: redPinIcon }).addTo(map);
      markerRef.current = marker;
    }

    // Try to get user browser geolocation if coordinates are not set
    if (!lat && !lng && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          if (mapRef.current) {
            mapRef.current.flyTo([userLat, userLng], 13);
            onChange(userLat, userLng);
            
            if (markerRef.current) {
              markerRef.current.setLatLng([userLat, userLng]);
            } else {
              const marker = L.marker([userLat, userLng], { icon: redPinIcon }).addTo(mapRef.current);
              markerRef.current = marker;
            }
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
      onChange(clickedLat, clickedLng);

      if (markerRef.current) {
        markerRef.current.setLatLng([clickedLat, clickedLng]);
      } else {
        const marker = L.marker([clickedLat, clickedLng], { icon: redPinIcon }).addTo(map);
        markerRef.current = marker;
      }

      map.panTo([clickedLat, clickedLng]);
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

  // Update marker position if coordinates change externally (like AI fill)
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapRef.current || lat === undefined || lng === undefined) return;

    const redPinIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 bg-cyan-500/30 rounded-full animate-ping"></div>
          <div class="w-4 h-4 bg-cyan-400 rounded-full border-2 border-[#020817] shadow-lg"></div>
        </div>
      `,
      className: 'custom-leaflet-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const marker = L.marker([lat, lng], { icon: redPinIcon }).addTo(mapRef.current);
      markerRef.current = marker;
    }
    mapRef.current.setView([lat, lng], 13);
  }, [lat, lng]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-900 shadow-2xl bg-slate-950">
      <div 
        ref={mapContainerRef} 
        className="w-full h-[260px] md:h-[300px] outline-none z-0" 
      />
      {lat && lng && (
        <div className="absolute bottom-2 left-2 z-[1000] bg-slate-950/90 border border-slate-900 rounded-lg px-2.5 py-1 text-[10px] text-cyan-400 font-mono shadow-md backdrop-blur-md">
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

export const MiniMap: React.FC<MiniMapProps> = ({ lat, lng, address }) => {
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
    }).setView([lat, lng], 14);

    mapRef.current = map;

    // Dark Matter tiles for premium look
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "",
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    // Beautiful Pin
    const pinIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-6 h-6 bg-cyan-500/20 rounded-full animate-pulse"></div>
          <div class="w-3.5 h-3.5 bg-cyan-400 rounded-full border-2 border-[#020817] shadow-lg"></div>
        </div>
      `,
      className: 'custom-mini-marker',
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
      <div 
        ref={mapContainerRef} 
        className="w-full h-[150px] outline-none z-0" 
      />
      <div className="absolute bottom-1.5 right-1.5 z-[1000] bg-slate-950/80 px-2 py-0.5 rounded text-[8px] text-slate-500 font-mono">
        © OpenStreetMap
      </div>
    </div>
  );
};
