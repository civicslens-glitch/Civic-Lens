import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Home, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLeaflet } from '@/hooks/useLeaflet';
import { TrafficDataPoint, PollutionMarker, MapLayers } from '@/types';

interface MapPanelProps {
  layers: MapLayers;
  trafficData: TrafficDataPoint[];
  pollutionData: PollutionMarker[];
  isLoading: boolean;
  timeHour: number;
}

export function MapPanel({ layers, trafficData, pollutionData, isLoading, timeHour }: MapPanelProps) {
  const [mapError, setMapError] = useState(false);
  
  // Use Leaflet hook
  const { 
    map, 
    isLoaded, 
    layers: leafletLayers,
    updateTrafficLayer, 
    updatePollutionLayer, 
    toggleLayer,
    flyTo 
  } = useLeaflet('map-container');

  // Convert TrafficDataPoint to TrafficPoint format for useLeaflet
  const convertTrafficData = (data: TrafficDataPoint[]) => {
    return data.map(point => ({
      id: point.id,
      lat: 28.6139 + (point.gridY - 10) * 0.002, // Convert grid to Delhi coordinates
      lng: 77.2090 + (point.gridX - 10) * 0.002,
      density: point.density,
      speed: 50 // Default speed
    }));
  };

  // Convert PollutionMarker to PollutionPoint format for useLeaflet
  const convertPollutionData = (data: PollutionMarker[]) => {
    return data.map(point => ({
      id: point.id,
      lat: point.lat,
      lng: point.lng,
      aqi: point.aqi,
      level: point.level
    }));
  };

  // Update traffic layer when data changes
  useEffect(() => {
    if (isLoaded && trafficData.length > 0) {
      try {
        const convertedData = convertTrafficData(trafficData);
        updateTrafficLayer(convertedData);
      } catch (error) {
        console.error('Error updating traffic layer:', error);
      }
    }
  }, [trafficData, isLoaded, updateTrafficLayer]);

  // Update pollution layer when data changes
  useEffect(() => {
    if (isLoaded && pollutionData.length > 0) {
      try {
        const convertedData = convertPollutionData(pollutionData);
        updatePollutionLayer(convertedData);
      } catch (error) {
        console.error('Error updating pollution layer:', error);
      }
    }
  }, [pollutionData, isLoaded, updatePollutionLayer]);

  // Handle layer visibility based on external props
  useEffect(() => {
    if (!isLoaded) return;
    
    // Toggle layers if they differ from external props
    if (leafletLayers.traffic !== layers.traffic) {
      toggleLayer('traffic');
    }
    if (leafletLayers.pollution !== layers.pollution) {
      toggleLayer('pollution');
    }
    if (leafletLayers.buildings !== layers.buildings) {
      toggleLayer('buildings');
    }
  }, [layers, leafletLayers, isLoaded, toggleLayer]);

  const handleZoomIn = () => {
    if (map) {
      map.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (map) {
      map.zoomOut();
    }
  };

  const handleResetView = () => {
    if (map) {
      map.setView([28.6139, 77.2090], 13);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative">
      <div className="flex-1 relative bg-slate-100 dark:bg-slate-800">
        <div 
          id="map-container"
          className="w-full h-full"
          data-testid="map-container"
          style={{ minHeight: '400px' }}
        />

        {/* Fallback overlays when map is not loaded */}
        {!isLoaded && !mapError && (
          <>
            {/* Simulated traffic heatmap overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/4 left-1/3 w-16 h-16 bg-red-500/40 rounded-full blur-md animate-pulse"></div>
              <div className="absolute top-1/2 left-1/2 w-20 h-20 bg-yellow-500/40 rounded-full blur-md"></div>
              <div className="absolute bottom-1/3 right-1/4 w-12 h-12 bg-green-500/40 rounded-full blur-md"></div>
              <div className="absolute top-1/3 right-1/3 w-14 h-14 bg-orange-500/40 rounded-full blur-md animate-pulse"></div>
            </div>

            {/* Simulated pollution markers */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/4 left-1/2 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg" title="High pollution (AQI: 142)"></div>
              <div className="absolute top-2/3 left-1/4 w-3 h-3 bg-yellow-500 rounded-full border-2 border-white shadow-lg" title="Moderate pollution (AQI: 87)"></div>
              <div className="absolute bottom-1/4 right-1/3 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-lg" title="Good air quality (AQI: 34)"></div>
            </div>

            {/* Loading message */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-lg">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading interactive map...</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          <Button
            onClick={handleZoomIn}
            variant="secondary"
            size="sm"
            className="w-10 h-10 p-0 bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl"
            data-testid="button-zoom-in"
            disabled={!isLoaded}
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleZoomOut}
            variant="secondary"
            size="sm"
            className="w-10 h-10 p-0 bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl"
            data-testid="button-zoom-out"
            disabled={!isLoaded}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleResetView}
            variant="secondary"
            size="sm"
            className="w-10 h-10 p-0 bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl"
            data-testid="button-reset-view"
            disabled={!isLoaded}
          >
            <Home className="w-4 h-4" />
          </Button>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-4 left-4 bg-white dark:bg-slate-800 rounded-lg shadow-lg px-3 py-2 flex items-center space-x-2"
            data-testid="map-loading"
          >
            <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
            <span className="text-xs text-slate-600 dark:text-slate-300">Updating...</span>
          </motion.div>
        )}

        {/* Success indicator when loaded */}
        {isLoaded && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-4 bg-green-500 text-white rounded-lg shadow-lg px-3 py-2 text-xs"
          >
            Free interactive map loaded successfully! 🗺️
          </motion.div>
        )}
      </div>
    </div>
  );
}