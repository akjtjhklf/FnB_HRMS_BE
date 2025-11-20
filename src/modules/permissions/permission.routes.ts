import { Router } from "express";
import { validateBody } from "../../middlewares/validate.middleware";
import {
  listPermissions,
  getPermission,
  createPermission,
  updatePermission,
  deletePermission,
} from "./permission.controller";
import {
  createPermissionSchema,
  updatePermissionSchema,
} from "./permission.dto";

const router = Router();

router.get("/", listPermissions);
router.get("/:id", getPermission);
router.post("/", validateBody(createPermissionSchema), createPermission);
router.patch("/:id", validateBody(updatePermissionSchema), updatePermission);
router.delete("/:id", deletePermission);

export default router;
