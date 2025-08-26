import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { TrafficPoint, PollutionPoint, MapLayers } from '@/types';

// Declare OSMBuildings as a global variable (loaded from CDN)
declare global {
  interface Window {
    OSMBuildings: any;
  }
}

export function useLeaflet(containerId: string) {
  const mapRef = useRef<L.Map | null>(null);
  const osmBuildingsRef = useRef<any>(null);
  const trafficLayerRef = useRef<L.LayerGroup | null>(null);
  const pollutionLayerRef = useRef<L.LayerGroup | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [layers, setLayers] = useState<MapLayers>({
    traffic: true,
    pollution: true,
    buildings: true,
  });

  const initializeMap = () => {
    if (mapRef.current) return;

    // Create map centered on Delhi (as suggested in instructions)
    const map = L.map(containerId, {
      center: [28.6139, 77.2090],
      zoom: 13,
      zoomControl: true
    });

    // Add OpenStreetMap base layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Initialize layer groups
    trafficLayerRef.current = L.layerGroup().addTo(map);
    pollutionLayerRef.current = L.layerGroup().addTo(map);

    // Add OSMBuildings plugin when available
    const initOSMBuildings = () => {
      if (window.OSMBuildings && !osmBuildingsRef.current) {
        try {
          osmBuildingsRef.current = new window.OSMBuildings(map).load();
          console.log('OSMBuildings initialized');
        } catch (error) {
          console.warn('OSMBuildings failed to initialize:', error);
        }
      }
    };

    // Try to initialize OSMBuildings immediately, or wait for script to load
    if (window.OSMBuildings) {
      initOSMBuildings();
    } else {
      // Wait for OSMBuildings script to load
      const checkOSMBuildings = setInterval(() => {
        if (window.OSMBuildings) {
          initOSMBuildings();
          clearInterval(checkOSMBuildings);
        }
      }, 100);

      // Clear interval after 5 seconds if OSMBuildings doesn't load
      setTimeout(() => clearInterval(checkOSMBuildings), 5000);
    }

    // Add a sample marker for Delhi
    L.marker([28.6139, 77.2090])
      .addTo(map)
      .bindPopup('Delhi - Civic Lens Demo')
      .openPopup();

    mapRef.current = map;
    setIsLoaded(true);
  };

  const updateTrafficLayer = (trafficData: TrafficPoint[]) => {
    if (!mapRef.current || !trafficLayerRef.current || !isLoaded) return;

    // Clear existing traffic markers
    trafficLayerRef.current.clearLayers();

    if (!layers.traffic) return;

    // Add traffic density markers using circle markers with heatmap-like colors
    trafficData.forEach(point => {
      const density = point.density;
      const radius = Math.max(5, density * 15);
      
      // Color scale similar to original heatmap
      let color = '#2166ac'; // blue for low density
      if (density > 0.2) color = '#67a9cf';
      if (density > 0.4) color = '#d1e5f0';
      if (density > 0.6) color = '#fdbf6f';
      if (density > 0.8) color = '#ef8a62';
      if (density > 0.9) color = '#b2182b'; // red for high density

      const circleMarker = L.circleMarker([point.lat, point.lng], {
        radius: radius,
        fillColor: color,
        color: 'white',
        weight: 1,
        opacity: 0.8,
        fillOpacity: 0.6
      }).bindPopup(`Traffic Density: ${Math.round(density * 100)}%`);

      trafficLayerRef.current?.addLayer(circleMarker);
    });
  };

  const updatePollutionLayer = (pollutionData: PollutionPoint[]) => {
    if (!mapRef.current || !pollutionLayerRef.current || !isLoaded) return;

    // Clear existing pollution markers
    pollutionLayerRef.current.clearLayers();

    if (!layers.pollution) return;

    // Add pollution markers
    pollutionData.forEach(point => {
      const color = point.level === 'good' ? '#10B981' : 
                   point.level === 'moderate' ? '#F59E0B' : '#EF4444';

      const circleMarker = L.circleMarker([point.lat, point.lng], {
        radius: 8,
        fillColor: color,
        color: 'white',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      }).bindPopup(`
        <div style="padding: 8px;">
          <h4 style="margin: 0; font-weight: bold;">${point.level.charAt(0).toUpperCase() + point.level.slice(1)} Pollution</h4>
          <p style="margin: 4px 0 0 0;">AQI: ${point.aqi}</p>
        </div>
      `);

      pollutionLayerRef.current?.addLayer(circleMarker);
    });
  };

  const toggleLayer = (layerName: keyof MapLayers) => {
    if (!mapRef.current) return;

    const newLayers = { ...layers, [layerName]: !layers[layerName] };
    setLayers(newLayers);
  };

  const flyTo = (coordinates: [number, number], zoom = 15) => {
    mapRef.current?.flyTo([coordinates[1], coordinates[0]], zoom, {
      duration: 1
    });
  };

  useEffect(() => {
    initializeMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      osmBuildingsRef.current = null;
      trafficLayerRef.current = null;
      pollutionLayerRef.current = null;
    };
  }, [containerId]);

  return {
    map: mapRef.current,
    isLoaded,
    layers,
    updateTrafficLayer,
    updatePollutionLayer,
    toggleLayer,
    flyTo,
  };
}