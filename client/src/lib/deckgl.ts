import { HexagonLayer } from '@deck.gl/aggregation-layers';
import type { TrafficPoint } from '@/types';

export function createTrafficHexagonLayer(trafficData: TrafficPoint[]) {
  return new HexagonLayer({
    id: 'traffic-hexagon-layer',
    data: trafficData.map(point => ({
      position: [point.lng, point.lat],
      value: point.density,
    })),
    getPosition: (d: any) => d.position,
    getElevationWeight: (d: any) => d.value,
    getColorWeight: (d: any) => d.value,
    elevationScale: 200,
    radius: 100,
    coverage: 0.8,
    extruded: true,
    colorRange: [
      [1, 152, 189],
      [73, 227, 206],
      [216, 254, 181],
      [254, 237, 177],
      [254, 173, 84],
      [209, 55, 78]
    ],
    updateTriggers: {
      getPosition: trafficData,
      getElevationWeight: trafficData,
      getColorWeight: trafficData,
    },
  });
}
