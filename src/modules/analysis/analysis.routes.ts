import { Router } from "express";
import { getStatistics } from "./analysis.controller";

const router = Router();

router.get("/statistics/employees", getStatistics);

export default router;