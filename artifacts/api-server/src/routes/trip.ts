import { Router, type IRouter } from "express";
import {
  CheckVehicleBody,
  PlanTripBody,
  AdjustTripBody,
  GetTrafficInfoBody,
} from "@workspace/api-zod";
import { generateTripPlan, checkVehicleSuitability, adjustTripPlan } from "../lib/tripPlanner.js";

const router: IRouter = Router();

router.post("/vehicle-check", (req, res) => {
  const parseResult = CheckVehicleBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid request", details: parseResult.error.flatten() });
    return;
  }
  const data = checkVehicleSuitability(parseResult.data);
  res.json(data);
});

router.post("/plan", async (req, res) => {
  const parseResult = PlanTripBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid request", details: parseResult.error.flatten() });
    return;
  }
  try {
    const data = await generateTripPlan(parseResult.data);
    res.json(data);
  } catch (err) {
    console.error("Trip plan error:", err);
    res.status(500).json({ error: "Failed to generate trip plan" });
  }
});

router.post("/adjust", async (req, res) => {
  const parseResult = AdjustTripBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid request", details: parseResult.error.flatten() });
    return;
  }
  try {
    const data = await adjustTripPlan(parseResult.data);
    res.json(data);
  } catch (err) {
    console.error("Trip adjust error:", err);
    res.status(500).json({ error: "Failed to adjust trip plan" });
  }
});

router.post("/traffic", (req, res) => {
  const parsed = GetTrafficInfoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }

  const INCIDENTS = [
    { type: "construction", description: "Road construction reducing lanes", location: "Mile marker 45", severity: "medium", delayMinutes: 10 },
    { type: "accident", description: "Multi-car accident on shoulder", location: "Highway junction", severity: "high", delayMinutes: 25 },
    { type: "congestion", description: "Heavy commuter traffic", location: "Downtown bypass", severity: "low", delayMinutes: 8 },
    { type: "weather", description: "Fog advisory, reduced speed limit", location: "Mountain pass", severity: "medium", delayMinutes: 15 },
  ];

  const hour = new Date().getUTCHours();
  const isPeakHour = (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 19);
  const randomIncidents = Math.random() > 0.5 ? [INCIDENTS[Math.floor(Math.random() * INCIDENTS.length)]] : [];
  const baseDelay = isPeakHour ? 15 : 5;
  const incidentDelay = randomIncidents.reduce((sum, inc) => sum + inc.delayMinutes, 0);
  const totalDelay = baseDelay + incidentDelay;

  let conditions: "clear" | "light" | "moderate" | "heavy" | "severe";
  if (totalDelay < 5) conditions = "clear";
  else if (totalDelay < 15) conditions = "light";
  else if (totalDelay < 30) conditions = "moderate";
  else if (totalDelay < 45) conditions = "heavy";
  else conditions = "severe";

  const recommendations: Record<string, string> = {
    clear: "Traffic is clear — great time to travel!",
    light: "Minor delays expected. Leave 10 minutes early.",
    moderate: "Moderate congestion on your route. Consider leaving earlier or taking the scenic route.",
    heavy: "Heavy traffic ahead. A 30+ minute delay is expected. Strongly consider an alternate route.",
    severe: "Severe conditions detected. Consider delaying your departure or choosing an alternate route.",
  };

  res.json({
    conditions,
    delayMinutes: totalDelay,
    incidents: randomIncidents,
    alternativeRouteAvailable: totalDelay > 20,
    recommendation: recommendations[conditions],
    updatedAt: new Date().toISOString(),
  });
});

export default router;
