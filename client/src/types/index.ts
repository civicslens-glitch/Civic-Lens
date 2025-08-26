export interface TrafficDataPoint {
  id: string;
  gridX: number;
  gridY: number;
  density: number;
  timeHour: number;
  timestamp: string;
}

export interface PollutionMarker {
  id: string;
  lat: number;
  lng: number;
  aqi: number;
  level: 'good' | 'moderate' | 'high';
  timestamp: string;
}

export interface Scenario {
  id: string;
  name: string;
  description?: string;
  data: any;
  trafficReduction: number;
  aqiImprovement: number;
  createdAt: string;
}

export interface MapLayers {
  traffic: boolean;
  pollution: boolean;
  buildings: boolean;
}

export interface Analytics {
  trafficChangePercent: number;
  aqiChange: number;
  currentAqi: number;
  lastUpdate: string;
}

export interface WebSocketMessage {
  type: 'traffic_update' | 'live_update' | 'scenario_update';
  data: any;
  timestamp: string;
}

export interface TrafficPoint {
  lat: number;
  lng: number;
  density: number;
}

export interface PollutionPoint {
  lat: number;
  lng: number;
  aqi: number;
  level: 'good' | 'moderate' | 'high';
}

export interface RealTimeUpdate {
  type: 'traffic_update' | 'live_update' | 'scenario_update' | 'scenario_created' | 'scenario_updated' | 'scenario_deleted' | 'simulation_applied';
  data: {
    traffic?: TrafficDataPoint[];
    pollution?: PollutionMarker[];
    trafficData?: TrafficDataPoint[];
    [key: string]: any;
  };
  timestamp: string;
}

export interface AnalyticsData {
  time: string;
  trafficDensity: number;
  aqiValue: number;
  timestamp: string;
}
