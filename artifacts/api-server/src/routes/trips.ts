import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { tripsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { SaveTripBody, UpdateTripBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const trips = await db.select().from(tripsTable).orderBy(tripsTable.createdAt);
    res.json({ trips });
  } catch (err) {
    req.log.error({ err }, "Failed to list trips");
    res.status(500).json({ error: "Failed to list trips" });
  }
});

router.post("/", async (req, res) => {
  const parsed = SaveTripBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }
  try {
    const data = parsed.data as Record<string, unknown>;
    const [trip] = await db.insert(tripsTable).values({
      name: data.name as string,
      travelers: data.travelers as number,
      vehicleType: data.vehicleType as string,
      startLocation: data.startLocation as string,
      destination: data.destination as string,
      startTime: data.startTime as string,
      preferences: (data.preferences as string[]) ?? [],
      plan: (data.plan as object) ?? null,
      customStops: (data.customStops as object[]) ?? [],
      isFavorite: false,
    }).returning();
    res.status(201).json(trip);
  } catch (err) {
    req.log.error({ err }, "Failed to save trip");
    res.status(500).json({ error: "Failed to save trip" });
  }
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  try {
    const [trip] = await db.select().from(tripsTable).where(eq(tripsTable.id, id));
    if (!trip) { res.status(404).json({ error: "Trip not found" }); return; }
    res.json(trip);
  } catch (err) {
    req.log.error({ err }, "Failed to get trip");
    res.status(500).json({ error: "Failed to get trip" });
  }
});

router.patch("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const parsed = UpdateTripBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }
  try {
    const data = parsed.data as Record<string, unknown>;
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;
    if (data.customStops !== undefined) updateData.customStops = data.customStops;
    if (data.plan !== undefined) updateData.plan = data.plan;
    const [updated] = await db.update(tripsTable).set(updateData as Parameters<typeof db.update>[0]["set"]).where(eq(tripsTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Trip not found" }); return; }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update trip");
    res.status(500).json({ error: "Failed to update trip" });
  }
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  try {
    await db.delete(tripsTable).where(eq(tripsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete trip");
    res.status(500).json({ error: "Failed to delete trip" });
  }
});

export default router;
