import { Router } from "express";
import { validateBody } from "../../middlewares/validate.middleware";
import {
  createSalaryScheme,
  deleteSalaryScheme,
  getSalaryScheme,
  listSalarySchemes,
  updateSalaryScheme,
} from "./salary-scheme.controller";
import {
  createSalarySchemeSchema,
  updateSalarySchemeSchema,
} from "./salary-scheme.dto";

const router = Router();

router.get("/", listSalarySchemes);
router.get("/:id", getSalaryScheme);
router.post("/", validateBody(createSalarySchemeSchema), createSalaryScheme);
router.put("/:id", validateBody(updateSalarySchemeSchema), updateSalaryScheme);
router.delete("/:id", deleteSalaryScheme);

export default router;
