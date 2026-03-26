import { Router, type IRouter } from "express";
import {
  CheckVehicleBody,
  PlanTripBody,
  AdjustTripBody,
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

router.post("/plan", (req, res) => {
  const parseResult = PlanTripBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid request", details: parseResult.error.flatten() });
    return;
  }
  const data = generateTripPlan(parseResult.data);
  res.json(data);
});

router.post("/adjust", (req, res) => {
  const parseResult = AdjustTripBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid request", details: parseResult.error.flatten() });
    return;
  }
  const data = adjustTripPlan(parseResult.data);
  res.json(data);
});

export default router;
