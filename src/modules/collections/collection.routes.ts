import { Router } from "express";
import { listCollections } from "./collection.controller";

const router = Router();

router.get("/", listCollections);

export default router;
