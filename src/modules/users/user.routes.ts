import { Router } from "express";
import { validateBody } from "../../middlewares/validate.middleware";
import { requireAuth } from "../../middlewares/auth.middleware";
import {
  createUser,
  deleteUser,
  getUser,
  listUsers,
  updateUser,
  getMe,
} from "./user.controller";
import { createUserSchema, updateUserSchema } from "./user.dto";

const router = Router();

// Get current user (must be before /:id to avoid conflict)
router.get("/me", requireAuth(), getMe);

router.get("/", listUsers);
router.get("/:id", getUser);
router.post("/", validateBody(createUserSchema), createUser);
router.put("/:id", validateBody(updateUserSchema), updateUser);
router.delete("/:id", deleteUser);

export default router;
