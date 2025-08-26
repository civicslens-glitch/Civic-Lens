export const LEAFLET_CONFIG = {
  defaultCenter: [28.6139, 77.2090] as [number, number], // Delhi coordinates
  defaultZoom: 13,
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
};

export const TILE_PROVIDERS = {
  light: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  dark: 'https://tiles.stadiamaps.com/tiles/alidade_dark/{z}/{x}/{y}{r}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
};

// Custom marker icons for different pollution levels
export const POLLUTION_COLORS = {
  good: '#10B981',
  moderate: '#F59E0B', 
  unhealthy: '#EF4444'
};

// Traffic density color scale
export const TRAFFIC_COLORS = {
  low: '#2166ac',
  medium: '#67a9cf',
  high: '#ef8a62',
  veryHigh: '#b2182b'
};