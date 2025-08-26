import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertScenarioSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // API Routes
  
  // GET /api/traffic?time=14 - Get traffic data for specific hour
  app.get("/api/traffic", async (req, res) => {
    try {
      const timeHour = parseInt(req.query.time as string) || 14;
      const data = await storage.getTrafficData(timeHour);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch traffic data" });
    }
  });

  // GET /api/pollution - Get pollution data
  app.get("/api/pollution", async (req, res) => {
    try {
      const data = await storage.getPollutionData();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pollution data" });
    }
  });

  // POST /api/simulate/bus - Simulate bus route scenario
  app.post("/api/simulate/bus", async (req, res) => {
    try {
      const { timeHour = 14, reductionFactor = 0.1 } = req.body;
      const data = await storage.generateTrafficData(timeHour, reductionFactor);
      
      // Calculate statistics
      const totalDensity = data.reduce((sum, item) => sum + item.density, 0);
      const avgDensity = totalDensity / data.length;
      const trafficReduction = reductionFactor * 100;
      const aqiImprovement = reductionFactor * 8; // Simulate AQI improvement
      
      res.json({
        trafficData: data,
        statistics: {
          trafficReduction,
          aqiImprovement,
          avgDensity,
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to simulate bus route" });
    }
  });

  // GET /api/scenarios - Get all scenarios
  app.get("/api/scenarios", async (req, res) => {
    try {
      const scenarios = await storage.getScenarios();
      res.json(scenarios);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scenarios" });
    }
  });

  // POST /api/scenarios - Create new scenario
  app.post("/api/scenarios", async (req, res) => {
    try {
      const validatedData = insertScenarioSchema.parse(req.body);
      const scenario = await storage.createScenario(validatedData);
      res.json(scenario);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid scenario data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create scenario" });
      }
    }
  });

  // DELETE /api/scenarios/:id - Delete scenario
  app.delete("/api/scenarios/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteScenario(id);
      if (deleted) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Scenario not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete scenario" });
    }
  });

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');

    // Send initial traffic data
    storage.getTrafficData(new Date().getHours()).then(data => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'traffic_update',
          data: data,
          timestamp: new Date().toISOString()
        }));
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Send live updates every 10 seconds
  setInterval(async () => {
    const currentHour = new Date().getHours();
    const trafficData = await storage.generateTrafficData(currentHour);
    const pollutionData = await storage.getPollutionData();

    const message = JSON.stringify({
      type: 'live_update',
      data: {
        traffic: trafficData,
        pollution: pollutionData,
        timestamp: new Date().toISOString()
      }
    });

    wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }, 10000);

  return httpServer;
}
