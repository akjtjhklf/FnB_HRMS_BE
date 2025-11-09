import { Router } from "express";
import { validateBody } from "../../middlewares/validate.middleware";
import {
  listDevices,
  getDevice,
  createDevice,
  updateDevice,
  deleteDevice,
} from "./device.controller";
import { createDeviceSchema, updateDeviceSchema } from "./device.dto";

const router = Router();

router.get("/", listDevices);
router.get("/:id", getDevice);
router.post("/", validateBody(createDeviceSchema), createDevice);
router.put("/:id", validateBody(updateDeviceSchema), updateDevice);
router.delete("/:id", deleteDevice);

export default router;
