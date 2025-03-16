import express from "express";
import { checkPenalty, applyPenalty } from "../controllers/penalty_controller";
import { driverAuth } from "../middleware/auth_middleware";

const router = express.Router();

router.get("/check-penalty", driverAuth, checkPenalty);
router.post("/apply-penalty", driverAuth, applyPenalty);

export default router;

