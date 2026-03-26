import { Router, type IRouter } from "express";
import healthRouter from "./health";
import tripRouter from "./trip";
import tripsRouter from "./trips";
import aiRouter from "./ai";
import placesRouter from "./places";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/trip", tripRouter);
router.use("/trips", tripsRouter);
router.use("/ai", aiRouter);
router.use("/places", placesRouter);

export default router;
