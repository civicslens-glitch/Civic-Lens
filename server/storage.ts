import { type User, type InsertUser, type Scenario, type InsertScenario, type TrafficData, type InsertTrafficData, type PollutionData, type InsertPollutionData } from "@shared/schema";
import { randomUUID } from "crypto";

// Mock data generator with seeded random for consistency
class SeededRandom {
  private seed: number;

  constructor(seed: number = 12345) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Scenarios
  getScenarios(): Promise<Scenario[]>;
  getScenario(id: string): Promise<Scenario | undefined>;
  createScenario(scenario: InsertScenario): Promise<Scenario>;
  deleteScenario(id: string): Promise<boolean>;
  
  // Traffic data
  getTrafficData(timeHour: number): Promise<TrafficData[]>;
  generateTrafficData(timeHour: number, reduction?: number): Promise<TrafficData[]>;
  
  // Pollution data
  getPollutionData(): Promise<PollutionData[]>;
  generatePollutionData(): Promise<PollutionData[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private scenarios: Map<string, Scenario>;
  private trafficCache: Map<string, TrafficData[]>;
  private pollutionCache: PollutionData[];
  private rng: SeededRandom;

  constructor() {
    this.users = new Map();
    this.scenarios = new Map();
    this.trafficCache = new Map();
    this.pollutionCache = [];
    this.rng = new SeededRandom();
    
    // Initialize with some default data
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create some sample scenarios
    const baselineScenario: Scenario = {
      id: "baseline",
      name: "Baseline Traffic Pattern",
      description: "Current traffic conditions",
      data: { type: "baseline" },
      trafficReduction: 0,
      aqiImprovement: 0,
      createdAt: new Date(),
    };
    
    this.scenarios.set("baseline", baselineScenario);
    
    // Generate initial pollution data
    this.generatePollutionData();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getScenarios(): Promise<Scenario[]> {
    return Array.from(this.scenarios.values());
  }

  async getScenario(id: string): Promise<Scenario | undefined> {
    return this.scenarios.get(id);
  }

  async createScenario(insertScenario: InsertScenario): Promise<Scenario> {
    const id = randomUUID();
    const scenario: Scenario = {
      ...insertScenario,
      id,
      description: insertScenario.description || null,
      trafficReduction: insertScenario.trafficReduction || 0,
      aqiImprovement: insertScenario.aqiImprovement || 0,
      createdAt: new Date(),
    };
    this.scenarios.set(id, scenario);
    return scenario;
  }

  async deleteScenario(id: string): Promise<boolean> {
    return this.scenarios.delete(id);
  }

  async getTrafficData(timeHour: number): Promise<TrafficData[]> {
    const cacheKey = `traffic-${timeHour}`;
    if (this.trafficCache.has(cacheKey)) {
      return this.trafficCache.get(cacheKey)!;
    }
    
    return this.generateTrafficData(timeHour);
  }

  async generateTrafficData(timeHour: number, reduction: number = 0): Promise<TrafficData[]> {
    const data: TrafficData[] = [];
    
    // Generate a 20x20 grid of traffic data
    for (let x = 0; x < 20; x++) {
      for (let y = 0; y < 20; y++) {
        // Create traffic patterns with peaks at rush hours
        let baseDensity = this.rng.range(0.1, 0.4);
        
        // Morning rush (7-9 AM)
        if (timeHour >= 7 && timeHour <= 9) {
          baseDensity += this.rng.range(0.3, 0.6);
        }
        
        // Evening rush (5-7 PM)
        if (timeHour >= 17 && timeHour <= 19) {
          baseDensity += this.rng.range(0.4, 0.7);
        }
        
        // Apply reduction factor for scenarios
        baseDensity *= (1 - reduction);
        
        // Ensure density stays within bounds
        baseDensity = Math.max(0, Math.min(1, baseDensity));
        
        data.push({
          id: randomUUID(),
          gridX: x,
          gridY: y,
          density: baseDensity,
          timeHour,
          timestamp: new Date(),
        });
      }
    }
    
    const cacheKey = `traffic-${timeHour}-${reduction}`;
    this.trafficCache.set(cacheKey, data);
    
    return data;
  }

  async getPollutionData(): Promise<PollutionData[]> {
    return this.pollutionCache;
  }

  async generatePollutionData(): Promise<PollutionData[]> {
    const data: PollutionData[] = [];
    
    // Generate pollution markers across the city
    // Simulating San Francisco-like coordinates
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
        timestamp: new Date(),
      });
    }
    
    this.pollutionCache = data;
    return data;
  }
}

export const storage = new MemStorage();
