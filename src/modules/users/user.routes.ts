import { Router } from "express";
import { validateBody } from "../../middlewares/validate.middleware";
import {
  createUser,
  deleteUser,
  getUser,
  listUsers,
  updateUser,
} from "./user.controller";
import { createUserSchema, updateUserSchema } from "./user.dto";

const router = Router();

router.get("/", listUsers);
router.get("/:id", getUser);
router.post("/", validateBody(createUserSchema), createUser);
router.put("/:id", validateBody(updateUserSchema), updateUser);
router.delete("/:id", deleteUser);

export default router;
