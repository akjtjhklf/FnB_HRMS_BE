import { Router } from "express";
import { validateBody } from "../../middlewares/validate.middleware";
import {
  createPolicy,
  deletePolicy,
  getPolicy,
  listPolicies,
  updatePolicy,
} from "./policy.controller";
import { createPolicySchema, updatePolicySchema } from "./policy.dto";

const router = Router();

router.get("/", listPolicies);
router.get("/:id", getPolicy);
router.post("/", validateBody(createPolicySchema), createPolicy);
router.put("/:id", validateBody(updatePolicySchema), updatePolicy);
router.delete("/:id", deletePolicy);

export default router;
