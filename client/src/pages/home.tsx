import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navigation } from '@/components/Navigation';
import { Sidebar } from '@/components/Sidebar';
import { MapPanel } from '@/components/MapPanel';
import { TimeSlider } from '@/components/TimeSlider';
import { useWebSocket } from '@/hooks/use-websocket';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { apiRequest } from '@/lib/queryClient';
import { TrafficDataPoint, PollutionMarker, MapLayers, Analytics, Scenario } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [timeHour, setTimeHour] = useState(14);
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [layers, setLayers] = useState<MapLayers>({
    traffic: true,
    pollution: true,
    buildings: true
  });
  
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isConnected, lastMessage, lastUpdate } = useWebSocket();

  // Fetch traffic data
  const { data: trafficData = [], isLoading: trafficLoading } = useQuery<TrafficDataPoint[]>({
    queryKey: ['/api/traffic', timeHour],
    queryFn: async () => {
      const response = await fetch(`/api/traffic?time=${timeHour}`);
      if (!response.ok) throw new Error('Failed to fetch traffic data');
      return response.json();
    }
  });

  // Fetch pollution data
  const { data: pollutionData = [] } = useQuery<PollutionMarker[]>({
    queryKey: ['/api/pollution'],
    queryFn: async () => {
      const response = await fetch('/api/pollution');
      if (!response.ok) throw new Error('Failed to fetch pollution data');
      return response.json();
    }
  });

  // Fetch scenarios
  const { data: scenarios = [] } = useQuery<Scenario[]>({
    queryKey: ['/api/scenarios']
  });

  // Bus route simulation mutation
  const busRouteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/simulate/bus', {
        timeHour,
        reductionFactor: 0.1
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Bus Route Added",
        description: `Traffic reduced by ${Math.round(data.statistics?.trafficReduction || 10)}%`,
        duration: 3000
      });
      
      // Invalidate and refetch traffic data
      queryClient.invalidateQueries({ queryKey: ['/api/traffic'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to simulate bus route",
        variant: "destructive",
        duration: 3000
      });
    }
  });

  // Create scenario mutation
  const createScenarioMutation = useMutation({
    mutationFn: async (scenarioData: { name: string; description?: string; data: any }) => {
      const response = await apiRequest('POST', '/api/scenarios', scenarioData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Scenario Saved",
        description: "New scenario has been created successfully",
        duration: 3000
      });
      queryClient.invalidateQueries({ queryKey: ['/api/scenarios'] });
    }
  });

  // Delete scenario mutation
  const deleteScenarioMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/scenarios/${id}`);
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Scenario Deleted",
        description: "Scenario has been removed",
        duration: 3000
      });
      queryClient.invalidateQueries({ queryKey: ['/api/scenarios'] });
    }
  });

  // Handle WebSocket updates
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'live_update') {
      queryClient.invalidateQueries({ queryKey: ['/api/traffic'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pollution'] });
    }
  }, [lastMessage, queryClient]);

  // Set active scenario to baseline if none selected
  useEffect(() => {
    if (scenarios.length > 0 && !activeScenario) {
      const baseline = scenarios.find(s => s.id === 'baseline');
      if (baseline) {
        setActiveScenario(baseline);
      } else if (scenarios[0]) {
        setActiveScenario(scenarios[0]);
      }
    }
  }, [scenarios, activeScenario]);

  const handleAddBusRoute = () => {
    busRouteMutation.mutate();
  };

  const handleSaveScenario = () => {
    const scenarioName = `Scenario ${scenarios.length + 1}`;
    createScenarioMutation.mutate({
      name: scenarioName,
      description: `Traffic simulation at ${new Date().toLocaleTimeString()}`,
      data: { 
        timeHour, 
        trafficData: trafficData.slice(0, 10), // Only save a sample
        timestamp: new Date().toISOString()
      },
    });
  };

  const handleExportScenario = () => {
    if (!activeScenario) {
      toast({
        title: "No Active Scenario",
        description: "Please select a scenario to export",
        variant: "destructive",
        duration: 3000
      });
      return;
    }
    
    const dataStr = JSON.stringify({
      ...activeScenario,
      trafficData: trafficData.slice(0, 10), // Export sample data
      pollutionData: pollutionData.slice(0, 5),
      exportedAt: new Date().toISOString()
    }, null, 2);
    
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeScenario.name.replace(/\s+/g, '_').toLowerCase()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Scenario Exported",
      description: "Scenario has been downloaded as JSON",
      duration: 3000
    });
  };

  const handleLayerToggle = (layer: keyof MapLayers) => {
    setLayers(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  };

  const handleScenarioSelect = (scenario: Scenario) => {
    setActiveScenario(scenario);
    toast({
      title: "Scenario Loaded",
      description: `Switched to ${scenario.name}`,
      duration: 2000
    });
  };

  const handleScenarioDelete = (id: string) => {
    if (id === 'baseline') {
      toast({
        title: "Cannot Delete",
        description: "Baseline scenario cannot be deleted",
        variant: "destructive",
        duration: 3000
      });
      return;
    }
    deleteScenarioMutation.mutate(id);
  };

  const handleCreateScenario = () => {
    handleSaveScenario();
  };

  // Calculate analytics
  const analytics: Analytics = {
    trafficChangePercent: activeScenario?.trafficReduction || 0,
    aqiChange: activeScenario?.aqiImprovement || 0,
    currentAqi: 42,
    lastUpdate: lastUpdate || 'Never'
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-screen flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors duration-300"
      data-testid="dashboard"
    >
      <Navigation
        onAddBusRoute={handleAddBusRoute}
        onSaveScenario={handleSaveScenario}
        onExportScenario={handleExportScenario}
        onToggleMobileMenu={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      />
      
      <div className="flex flex-1 h-[calc(100vh-4rem)] relative">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <Sidebar
            isOpen={sidebarOpen}
            layers={layers}
            onLayerToggle={handleLayerToggle}
            scenarios={scenarios}
            onScenarioSelect={handleScenarioSelect}
            onScenarioDelete={handleScenarioDelete}
            onCreateScenario={handleCreateScenario}
            analytics={analytics}
            isConnected={isConnected}
            activeScenario={activeScenario}
          />
        )}
        
        <div className="flex-1 flex flex-col">
          <MapPanel
            layers={layers}
            trafficData={trafficData}
            pollutionData={pollutionData}
            isLoading={trafficLoading || busRouteMutation.isPending}
            timeHour={timeHour}
          />
          
          <TimeSlider
            value={timeHour}
            onChange={setTimeHour}
          />
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobile && mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-80 z-50"
            >
              <Sidebar
                isOpen={true}
                layers={layers}
                onLayerToggle={handleLayerToggle}
                scenarios={scenarios}
                onScenarioSelect={handleScenarioSelect}
                onScenarioDelete={handleScenarioDelete}
                onCreateScenario={handleCreateScenario}
                analytics={analytics}
                isConnected={isConnected}
                activeScenario={activeScenario}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
