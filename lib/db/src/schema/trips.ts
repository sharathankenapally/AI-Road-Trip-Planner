import { pgTable, text, serial, integer, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tripsTable = pgTable("trips", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  travelers: integer("travelers").notNull(),
  vehicleType: text("vehicle_type").notNull(),
  startLocation: text("start_location").notNull(),
  destination: text("destination").notNull(),
  startTime: text("start_time").notNull(),
  preferences: jsonb("preferences").$type<string[]>().default([]),
  plan: jsonb("plan"),
  customStops: jsonb("custom_stops").$type<object[]>().default([]),
  isFavorite: boolean("is_favorite").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTripSchema = createInsertSchema(tripsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof tripsTable.$inferSelect;
