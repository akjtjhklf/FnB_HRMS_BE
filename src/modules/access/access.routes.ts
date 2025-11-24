import { Router } from "express";
import AccessController from "./access.controller";

const router = Router();

// Specific routes must come before generic routes to avoid conflicts
router.post("/role/:roleId", AccessController.updateRolePolicies);
router.get("/role/:roleId", AccessController.getRolePolicies);

router.post("/assign", AccessController.assignAccess);
router.get("/:userId", AccessController.getAccess);

export default router;
