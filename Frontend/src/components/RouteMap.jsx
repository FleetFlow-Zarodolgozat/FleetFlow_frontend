import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons (Leaflet + bundler issue)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const RouteMap = ({ startLocation, endLocation, activeField = 'start', onLocationSelect, onDistanceCalculated }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routeLayerRef = useRef(null);
  const markersRef = useRef([]);
  const clickMarkerRef = useRef(null);
  const [status, setStatus] = useState('');
  const onLocationSelectRef = useRef(onLocationSelect);
  const activeFieldRef = useRef(activeField);
  const onDistanceCalculatedRef = useRef(onDistanceCalculated);

  // Keep refs in sync so click handler always has latest values
  useEffect(() => { onLocationSelectRef.current = onLocationSelect; }, [onLocationSelect]);
  useEffect(() => { activeFieldRef.current = activeField; }, [activeField]);
  useEffect(() => { onDistanceCalculatedRef.current = onDistanceCalculated; }, [onDistanceCalculated]);

  useEffect(() => {
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        center: [47.4979, 19.0402], // Budapest default
        zoom: 7,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);

      // Click to pick location
      mapInstanceRef.current.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const a = data.address || {};

          // City: prefer most specific populated place
          const city = a.city || a.town || a.municipality || a.village || a.hamlet || a.suburb || '';
          // Street: try all road-like fields
          const street = a.road || a.pedestrian || a.footway || a.path || a.cycleway || a.residential || '';

          let address;
          if (city && street) {
            address = `${city}, ${street}`;
          } else if (city) {
            address = city;
          } else if (street) {
            address = street;
          } else {
            // last resort: first 2 parts of display_name
            const parts = (data.display_name || '').split(', ');
            address = parts.slice(0, 2).join(', ') || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          }
          if (clickMarkerRef.current) {
            clickMarkerRef.current.remove();
          }
          clickMarkerRef.current = L.marker([lat, lng], {
            icon: L.icon({
              iconUrl: activeFieldRef.current === 'start'
                ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png'
                : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
              shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
            })
          })
          .bindPopup(`<b>${activeFieldRef.current === 'start' ? 'Departure' : 'Arrival'}:</b><br/>${address}`)
          .addTo(mapInstanceRef.current)
          .openPopup();

          if (onLocationSelectRef.current) {
            onLocationSelectRef.current(address);
          }
        } catch {
          // fallback: use coordinates
          const coord = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          if (onLocationSelectRef.current) {
            onLocationSelectRef.current(coord);
          }
        }
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Clear previous markers and route
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }

    if (!startLocation && !endLocation) {
      setStatus('');
      return;
    }

    const geocode = async (query) => {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (!data.length) throw new Error(`Not found: ${query}`);
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    };

    const fetchRoute = async () => {
      setStatus('Loading...');
      try {
        // If only one location is filled, zoom to it
        if (startLocation && !endLocation) {
          const start = await geocode(startLocation);
          const marker = L.marker([start.lat, start.lng])
            .bindPopup(`<b>Start:</b> ${startLocation}`)
            .addTo(map);
          markersRef.current = [marker];
          map.setView([start.lat, start.lng], 12);
          setStatus('');
          return;
        }
        if (endLocation && !startLocation) {
          const end = await geocode(endLocation);
          const marker = L.marker([end.lat, end.lng])
            .bindPopup(`<b>End:</b> ${endLocation}`)
            .addTo(map);
          markersRef.current = [marker];
          map.setView([end.lat, end.lng], 12);
          setStatus('');
          return;
        }

        // Both filled: show route
        const [start, end] = await Promise.all([
          geocode(startLocation),
          geocode(endLocation),
        ]);
        const startMarker = L.marker([start.lat, start.lng])
          .bindPopup(`<b>Start:</b> ${startLocation}`)
          .addTo(map);
        const endMarker = L.marker([end.lat, end.lng])
          .bindPopup(`<b>End:</b> ${endLocation}`)
          .addTo(map);
        markersRef.current = [startMarker, endMarker];
        const routeRes = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`
        );
        const routeData = await routeRes.json();

        if (routeData.code === 'Ok' && routeData.routes.length > 0) {
          const coords = routeData.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
          routeLayerRef.current = L.polyline(coords, {
            color: '#2563eb',
            weight: 4,
            opacity: 0.8,
          }).addTo(map);

          // Fit map to route
          map.fitBounds(routeLayerRef.current.getBounds(), { padding: [30, 30] });

          // Report distance in km (OSRM returns meters)
          const distanceKm = (routeData.routes[0].distance / 1000).toFixed(1);
          if (onDistanceCalculatedRef.current) {
            onDistanceCalculatedRef.current(distanceKm);
          }
          setStatus('');
        } else {
          // No route, just fit to markers
          const bounds = L.latLngBounds([
            [start.lat, start.lng],
            [end.lat, end.lng],
          ]);
          map.fitBounds(bounds, { padding: [40, 40] });
          setStatus('Route not available, showing locations.');
        }
      } catch {
        setStatus('Could not find location.');
      }
    };

    // Debounce: wait 800ms after user stops typing
    const timer = setTimeout(fetchRoute, 800);
    return () => clearTimeout(timer);
  }, [startLocation, endLocation]);

  return (
    <div className="route-map">
      <div ref={mapRef} className="route-map__canvas" />
      {/* Active field hint */}
      <div style={{
        position: 'absolute',
        top: 8,
        right: 8,
        background: activeField === 'start' ? 'rgba(34,197,94,0.9)' : 'rgba(239,68,68,0.9)',
        color: '#fff',
        padding: '4px 10px',
        borderRadius: '8px',
        fontSize: '0.75rem',
        fontWeight: 600,
        zIndex: 1000,
        pointerEvents: 'none',
      }}>
        Click to set {activeField === 'start' ? 'Departure' : 'Arrival'}
      </div>
      {status && (
        <div style={{
          position: 'absolute',
          bottom: 8,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.9)',
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '0.8rem',
          color: '#475569',
          zIndex: 1000,
          whiteSpace: 'nowrap',
        }}>
          {status}
        </div>
      )}
    </div>
  );
};

export default RouteMap;
