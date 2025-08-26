import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const scenarios = pgTable("scenarios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  data: jsonb("data").notNull(),
  trafficReduction: real("traffic_reduction").default(0),
  aqiImprovement: real("aqi_improvement").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const trafficData = pgTable("traffic_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gridX: integer("grid_x").notNull(),
  gridY: integer("grid_y").notNull(),
  density: real("density").notNull(),
  timeHour: integer("time_hour").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const pollutionData = pgTable("pollution_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  aqi: integer("aqi").notNull(),
  level: text("level").notNull(), // 'low', 'moderate', 'high'
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertScenarioSchema = createInsertSchema(scenarios).omit({
  id: true,
  createdAt: true,
});

export const insertTrafficDataSchema = createInsertSchema(trafficData).omit({
  id: true,
  timestamp: true,
});

export const insertPollutionDataSchema = createInsertSchema(pollutionData).omit({
  id: true,
  timestamp: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Scenario = typeof scenarios.$inferSelect;
export type InsertScenario = z.infer<typeof insertScenarioSchema>;
export type TrafficData = typeof trafficData.$inferSelect;
export type InsertTrafficData = z.infer<typeof insertTrafficDataSchema>;
export type PollutionData = typeof pollutionData.$inferSelect;
export type InsertPollutionData = z.infer<typeof insertPollutionDataSchema>;
