import { Router } from "express";
import { validateBody } from "../../middlewares/validate.middleware";
import {
  listRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
} from "./role.controller";
import { createRoleSchema, updateRoleSchema } from "./role.dto";

const router = Router();

router.get("/", listRoles);
router.get("/:id", getRole);
router.post("/", validateBody(createRoleSchema), createRole);
router.put("/:id", validateBody(updateRoleSchema), updateRole);
router.delete("/:id", deleteRole);

export default router;
