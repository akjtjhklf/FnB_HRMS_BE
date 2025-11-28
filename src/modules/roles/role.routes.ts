import { Router } from "express";
import { validateBody } from "../../middlewares/validate.middleware";
import {
  listRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  getRolePolicies,
  assignPoliciesToRole,
  removeRolePolicy,
} from "./role.controller";
import { createRoleSchema, updateRoleSchema } from "./role.dto";

const router = Router();

router.get("/", listRoles);
router.get("/:id", getRole);
router.post("/", validateBody(createRoleSchema), createRole);
router.patch("/:id", validateBody(updateRoleSchema), updateRole);
router.delete("/:id", deleteRole);

// Role-Policy Management
router.get("/:id/policies", getRolePolicies);
router.post("/:id/policies", assignPoliciesToRole);
router.delete("/:id/policies/:policyId", removeRolePolicy);

export default router;
