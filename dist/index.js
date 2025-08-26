// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

// server/storage.ts
import { randomUUID } from "crypto";
var SeededRandom = class {
  seed;
  constructor(seed = 12345) {
    this.seed = seed;
  }
  next() {
    this.seed = this.seed * 16807 % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
  range(min, max) {
    return min + this.next() * (max - min);
  }
};
var MemStorage = class {
  users;
  scenarios;
  trafficCache;
  pollutionCache;
  rng;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.scenarios = /* @__PURE__ */ new Map();
    this.trafficCache = /* @__PURE__ */ new Map();
    this.pollutionCache = [];
    this.rng = new SeededRandom();
    this.initializeDefaultData();
  }
  initializeDefaultData() {
    const baselineScenario = {
      id: "baseline",
      name: "Baseline Traffic Pattern",
      description: "Current traffic conditions",
      data: { type: "baseline" },
      trafficReduction: 0,
      aqiImprovement: 0,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.scenarios.set("baseline", baselineScenario);
    this.generatePollutionData();
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async createUser(insertUser) {
    const id = randomUUID();
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  async getScenarios() {
    return Array.from(this.scenarios.values());
  }
  async getScenario(id) {
    return this.scenarios.get(id);
  }
  async createScenario(insertScenario) {
    const id = randomUUID();
    const scenario = {
      ...insertScenario,
      id,
      description: insertScenario.description || null,
      trafficReduction: insertScenario.trafficReduction || 0,
      aqiImprovement: insertScenario.aqiImprovement || 0,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.scenarios.set(id, scenario);
    return scenario;
  }
  async deleteScenario(id) {
    return this.scenarios.delete(id);
  }
  async getTrafficData(timeHour) {
    const cacheKey = `traffic-${timeHour}`;
    if (this.trafficCache.has(cacheKey)) {
      return this.trafficCache.get(cacheKey);
    }
    return this.generateTrafficData(timeHour);
  }
  async generateTrafficData(timeHour, reduction = 0) {
    const data = [];
    for (let x = 0; x < 20; x++) {
      for (let y = 0; y < 20; y++) {
        let baseDensity = this.rng.range(0.1, 0.4);
        if (timeHour >= 7 && timeHour <= 9) {
          baseDensity += this.rng.range(0.3, 0.6);
        }
        if (timeHour >= 17 && timeHour <= 19) {
          baseDensity += this.rng.range(0.4, 0.7);
        }
        baseDensity *= 1 - reduction;
        baseDensity = Math.max(0, Math.min(1, baseDensity));
        data.push({
          id: randomUUID(),
          gridX: x,
          gridY: y,
          density: baseDensity,
          timeHour,
          timestamp: /* @__PURE__ */ new Date()
        });
      }
    }
    const cacheKey = `traffic-${timeHour}-${reduction}`;
    this.trafficCache.set(cacheKey, data);
    return data;
  }
  async getPollutionData() {
    return this.pollutionCache;
  }
  async generatePollutionData() {
    const data = [];
    const baseLatLng = { lat: 37.7749, lng: -122.4194 };
    for (let i = 0; i < 15; i++) {
      const lat = baseLatLng.lat + this.rng.range(-0.05, 0.05);
      const lng = baseLatLng.lng + this.rng.range(-0.05, 0.05);
      const aqi = Math.floor(this.rng.range(20, 150));
      let level = "good";
      if (aqi > 50) level = "moderate";
      if (aqi > 100) level = "high";
      data.push({
        id: randomUUID(),
        lat,
        lng,
        aqi,
        level,
        timestamp: /* @__PURE__ */ new Date()
      });
    }
    this.pollutionCache = data;
    return data;
  }
};
var storage = new MemStorage();

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var scenarios = pgTable("scenarios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  data: jsonb("data").notNull(),
  trafficReduction: real("traffic_reduction").default(0),
  aqiImprovement: real("aqi_improvement").default(0),
  createdAt: timestamp("created_at").defaultNow()
});
var trafficData = pgTable("traffic_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gridX: integer("grid_x").notNull(),
  gridY: integer("grid_y").notNull(),
  density: real("density").notNull(),
  timeHour: integer("time_hour").notNull(),
  timestamp: timestamp("timestamp").defaultNow()
});
var pollutionData = pgTable("pollution_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  aqi: integer("aqi").notNull(),
  level: text("level").notNull(),
  // 'low', 'moderate', 'high'
  timestamp: timestamp("timestamp").defaultNow()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var insertScenarioSchema = createInsertSchema(scenarios).omit({
  id: true,
  createdAt: true
});
var insertTrafficDataSchema = createInsertSchema(trafficData).omit({
  id: true,
  timestamp: true
});
var insertPollutionDataSchema = createInsertSchema(pollutionData).omit({
  id: true,
  timestamp: true
});

// server/routes.ts
import { z } from "zod";
async function registerRoutes(app2) {
  const httpServer = createServer(app2);
  app2.get("/api/traffic", async (req, res) => {
    try {
      const timeHour = parseInt(req.query.time) || 14;
      const data = await storage.getTrafficData(timeHour);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch traffic data" });
    }
  });
  app2.get("/api/pollution", async (req, res) => {
    try {
      const data = await storage.getPollutionData();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pollution data" });
    }
  });
  app2.post("/api/simulate/bus", async (req, res) => {
    try {
      const { timeHour = 14, reductionFactor = 0.1 } = req.body;
      const data = await storage.generateTrafficData(timeHour, reductionFactor);
      const totalDensity = data.reduce((sum, item) => sum + item.density, 0);
      const avgDensity = totalDensity / data.length;
      const trafficReduction = reductionFactor * 100;
      const aqiImprovement = reductionFactor * 8;
      res.json({
        trafficData: data,
        statistics: {
          trafficReduction,
          aqiImprovement,
          avgDensity
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to simulate bus route" });
    }
  });
  app2.get("/api/scenarios", async (req, res) => {
    try {
      const scenarios2 = await storage.getScenarios();
      res.json(scenarios2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scenarios" });
    }
  });
  app2.post("/api/scenarios", async (req, res) => {
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
  app2.delete("/api/scenarios/:id", async (req, res) => {
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
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");
    storage.getTrafficData((/* @__PURE__ */ new Date()).getHours()).then((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: "traffic_update",
          data,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }));
      }
    });
    ws.on("close", () => {
      console.log("WebSocket client disconnected");
    });
    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });
  setInterval(async () => {
    const currentHour = (/* @__PURE__ */ new Date()).getHours();
    const trafficData2 = await storage.generateTrafficData(currentHour);
    const pollutionData2 = await storage.getPollutionData();
    const message = JSON.stringify({
      type: "live_update",
      data: {
        traffic: trafficData2,
        pollution: pollutionData2,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
    wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }, 1e4);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  const listenOptions = {
    port,
    host: "0.0.0.0"
  };
  if (process.platform !== "win32") {
    listenOptions.reusePort = true;
  }
  server.listen(listenOptions, () => {
    log(`serving on port ${port}`);
  });
})();
