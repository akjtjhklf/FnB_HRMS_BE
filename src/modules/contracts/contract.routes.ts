import { Router } from "express";
import { validateBody } from "../../middlewares/validate.middleware";
import {
  createContract,
  deleteContract,
  getContract,
  listContracts,
  updateContract,
} from "./contract.controller";
import { createContractSchema, updateContractSchema } from "./contract.dto";

const router = Router();

router.get("/", listContracts);
router.get("/:id", getContract);
router.post("/", validateBody(createContractSchema), createContract);
router.patch("/:id", validateBody(updateContractSchema), updateContract);
router.delete("/:id", deleteContract);

export default router;
