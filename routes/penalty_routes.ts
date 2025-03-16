import express from "express";
import { checkPenalty, applyPenalty } from "../controllers/penalty_controller";
import { driverAuth } from "../middleware/auth_middleware";

const router = express.Router();

/**
 * @swagger
 * /penalty/check-penalty:
 *   get:
 *     summary: Check if a penalty applies to the driver.
 *     description: Checks the driver's active session and calculates penalty if they exceed the allowed time.
 *     tags:
 *       - Penalty
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-email
 *         required: true
 *         schema:
 *           type: string
 *         description: Driver's email address (used for authentication).
 *     responses:
 *       200:
 *         description: Successfully retrieved penalty details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 session_id:
 *                   type: string
 *                 start_time:
 *                   type: string
 *                   format: date-time
 *                 duration:
 *                   type: integer
 *                   description: Duration in minutes.
 *                 penalty:
 *                   type: integer
 *                   description: Penalty amount.
 *                 msg:
 *                   type: string
 *       400:
 *         description: Missing x-email header.
 *       404:
 *         description: No active session found.
 *       500:
 *         description: Server error.
 */
router.get("/check-penalty", driverAuth, checkPenalty);

/**
 * @swagger
 * /penalty/apply-penalty:
 *   post:
 *     summary: Apply a penalty to the driver.
 *     description: Deducts the penalty amount from the driver's balance if they exceed the allowed parking time.
 *     tags:
 *       - Penalty
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-email
 *         required: true
 *         schema:
 *           type: string
 *         description: Driver's email address (used for authentication).
 *     responses:
 *       200:
 *         description: Successfully applied the penalty.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 session_id:
 *                   type: string
 *                 duration:
 *                   type: integer
 *                 penalty:
 *                   type: integer
 *                 new_balance:
 *                   type: integer
 *                 msg:
 *                   type: string
 *       400:
 *         description: Missing x-email header.
 *       404:
 *         description: No active session found.
 *       500:
 *         description: Server error.
 */
router.post("/apply-penalty", driverAuth, applyPenalty);

export default router;
