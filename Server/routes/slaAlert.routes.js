import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import * as alertController from '../controllers/slaAlert.controller.js'
const router = Router();
router.use(authenticate);
router.get("/", alertController.listAlerts);
router.patch("/:id/acknowledge", alertController.acknowledgeAlert);

export default router;