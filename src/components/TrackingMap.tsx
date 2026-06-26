'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

// Fix missing marker icons in leaflet with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Location {
  id: string;
  name: string;
  address: string;
  lat?: string | number;
  lon?: string | number;
  isDone?: boolean;
}

interface TrackingMapProps {
  locations: Location[];
  activeDay: number;
}

const createNumberedIcon = (number: number, isDone: boolean) => {
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `<div style="background-color: ${isDone ? '#10b981' : '#3b82f6'}; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.2); font-size: 14px; transition: all 0.3s;">${number}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

function MapBoundsUpdater({ locations }: { locations: Location[] }) {
  const map = useMap();
  useEffect(() => {
    // Fix Leaflet loading issue in hidden/absolute containers
    const timer = setTimeout(() => {
      map.invalidateSize();
      const validLocs = locations.filter(l => l.lat && l.lon);
      if (validLocs.length > 0) {
        const bounds = L.latLngBounds(validLocs.map(l => [Number(l.lat), Number(l.lon)]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }, 250);
    
    return () => clearTimeout(timer);
  }, [locations, map]);
  return null;
}

export default function TrackingMap({ locations, activeDay }: TrackingMapProps) {
  // Filter locations that have valid coordinates
  const validLocations = locations.filter(l => l.lat && l.lon);
  
  // Default center (Ho Chi Minh City)
  const defaultCenter: [number, number] = [10.8231, 106.6297];
  const center: [number, number] = validLocations.length > 0 
    ? [Number(validLocations[0].lat), Number(validLocations[0].lon)] 
    : defaultCenter;

  const positions: [number, number][] = validLocations.map(l => [Number(l.lat), Number(l.lon)]);
  const positionsStr = JSON.stringify(positions);

  const [routePositions, setRoutePositions] = useState<[number, number][]>([]);

  useEffect(() => {
    async function fetchRoute() {
      if (validLocations.length < 2) {
        setRoutePositions([]);
        return;
      }
      try {
        // OSRM expects longitude,latitude
        const coordString = validLocations.map(l => `${l.lon},${l.lat}`).join(';');
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`);
        const data = await res.json();
        
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const coords = data.routes[0].geometry.coordinates;
          // Convert [lon, lat] from GeoJSON to [lat, lon] for Leaflet
          const latLngs: [number, number][] = coords.map((c: [number, number]) => [c[1], c[0]]);
          setRoutePositions(latLngs);
        } else {
          // Fallback to straight lines
          setRoutePositions(positions);
        }
      } catch (err) {
        console.error("Failed to fetch route from OSRM", err);
        setRoutePositions(positions); // Fallback
      }
    }
    
    fetchRoute();
  }, [positionsStr]);

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        {validLocations.map((loc, idx) => (
          <Marker 
            key={loc.id} 
            position={[Number(loc.lat), Number(loc.lon)]}
            icon={createNumberedIcon(idx + 1, !!loc.isDone)}
          >
            <Popup className="rounded-xl">
              <div className="font-sans">
                <h4 className="font-bold text-sm mb-1">{loc.name}</h4>
                {loc.address && <p className="text-xs text-gray-500 mb-2 leading-relaxed">{loc.address}</p>}
                {loc.isDone ? (
                  <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">Đã hoàn thành</span>
                ) : (
                  <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">Sắp tới</span>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {routePositions.length > 1 && (
          <Polyline 
            positions={routePositions} 
            color="#3b82f6" 
            weight={5} 
            opacity={0.8} 
            dashArray="1, 0" 
            className="animate-pulse"
          />
        )}

        <MapBoundsUpdater locations={validLocations} />
      </MapContainer>
    </div>
  );
}

