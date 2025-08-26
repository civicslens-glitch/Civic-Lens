import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { MapLayers, Analytics, Scenario } from '@/types';

interface SidebarProps {
  isOpen: boolean;
  layers: MapLayers;
  onLayerToggle: (layer: keyof MapLayers) => void;
  scenarios: Scenario[];
  onScenarioSelect: (scenario: Scenario) => void;
  onScenarioDelete: (id: string) => void;
  onCreateScenario: () => void;
  analytics: Analytics;
  isConnected: boolean;
  activeScenario: Scenario | null;
}

export function Sidebar({
  isOpen,
  layers,
  onLayerToggle,
  scenarios,
  onScenarioSelect,
  onScenarioDelete,
  onCreateScenario,
  analytics,
  isConnected,
  activeScenario
}: SidebarProps) {
  // Mock chart data for traffic change
  const chartData = [
    { time: '6AM', value: -5 },
    { time: '8AM', value: -12 },
    { time: '10AM', value: -8 },
    { time: '12PM', value: -10 },
    { time: '2PM', value: -15 },
    { time: '4PM', value: -7 },
    { time: '6PM', value: -18 },
    { time: '8PM', value: -12 }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: -320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -320, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="hidden lg:flex flex-col w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-colors duration-300"
        >
          
          {/* Layer Controls */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Map Layers</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-civic-blue rounded-full"></div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">Traffic Heatmap</span>
                </div>
                <Switch
                  checked={layers.traffic}
                  onCheckedChange={() => onLayerToggle('traffic')}
                  data-testid="switch-traffic-layer"
                />
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-civic-green rounded-full"></div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">Pollution Markers</span>
                </div>
                <Switch
                  checked={layers.pollution}
                  onCheckedChange={() => onLayerToggle('pollution')}
                  data-testid="switch-pollution-layer"
                />
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">3D Buildings</span>
                </div>
                <Switch
                  checked={layers.buildings}
                  onCheckedChange={() => onLayerToggle('buildings')}
                  data-testid="switch-buildings-layer"
                />
              </div>
            </div>
          </div>

          {/* Scenario Management */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Scenarios</h3>
            
            {/* Active Scenario */}
            {activeScenario && (
              <div className="p-3 bg-civic-blue/10 dark:bg-civic-blue/20 rounded-lg mb-3 border border-civic-blue/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-civic-blue" data-testid="text-active-scenario">
                    {activeScenario.name}
                  </span>
                  <Badge variant="secondary" className="bg-civic-blue text-white">Active</Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {activeScenario.description || 'No description'}
                </p>
              </div>
            )}

            {/* Scenarios List */}
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {scenarios.filter(s => s.id !== activeScenario?.id).map((scenario) => (
                <motion.div
                  key={scenario.id}
                  whileHover={{ scale: 1.02 }}
                  className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200 cursor-pointer"
                  onClick={() => onScenarioSelect(scenario)}
                  data-testid={`scenario-${scenario.id}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700 dark:text-slate-300">{scenario.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onScenarioDelete(scenario.id);
                      }}
                      className="text-xs text-slate-500 hover:text-civic-red p-1 h-auto"
                      data-testid={`button-delete-scenario-${scenario.id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Traffic reduced by {scenario.trafficReduction}%
                  </p>
                </motion.div>
              ))}
            </div>

            <Button
              onClick={onCreateScenario}
              variant="outline"
              className="w-full mt-3"
              size="sm"
              data-testid="button-create-scenario"
            >
              <Plus className="w-3 h-3 mr-2" />
              New Scenario
            </Button>
          </div>

          {/* Analytics Panel */}
          <div className="flex-1 p-4 overflow-y-auto">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Real-time Analytics</h3>
            
            {/* Traffic Impact Chart */}
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Traffic Change
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-24 mb-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <XAxis dataKey="time" hide />
                      <YAxis hide />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="hsl(var(--civic-blue))" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>6AM</span>
                  <span className="text-civic-blue font-medium" data-testid="text-traffic-change">
                    {analytics.trafficChangePercent}%
                  </span>
                  <span>6PM</span>
                </div>
              </CardContent>
            </Card>

            {/* Air Quality Index */}
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Air Quality Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-civic-green" data-testid="text-aqi-change">
                    +{analytics.aqiChange}%
                  </div>
                  <div className="text-xs text-slate-500">improvement</div>
                </div>
                <div className="mt-2 bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                  <motion.div 
                    className="bg-civic-green h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: '75%' }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Current AQI: <span className="text-civic-green font-medium" data-testid="text-current-aqi">
                    Good ({analytics.currentAqi})
                  </span>
                </p>
              </CardContent>
            </Card>

            {/* Live Connection Status */}
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <motion.div 
                      className={`w-2 h-2 rounded-full ${isConnected ? 'bg-civic-green' : 'bg-civic-red'}`}
                      animate={{ scale: isConnected ? [1, 1.2, 1] : 1 }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                    <span className={`text-xs font-medium ${isConnected ? 'text-civic-green' : 'text-civic-red'}`}>
                      {isConnected ? 'Live Updates' : 'Disconnected'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500" data-testid="text-last-update">
                    {analytics.lastUpdate}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
