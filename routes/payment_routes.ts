import express from "express";
import { fetchPaymentStatus } from "../controllers/payment_controller";
import { parkingOwnerAuth } from "../middleware/auth_middleware";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Payment
 *   description: API to check parking lot owners' payment status
 */

/**
 * @swagger
 * /payment/status:
 *   get:
 *     summary: Fetch payment status for a parking lot owner.
 *     description: Retrieves the payment status of a parking lot owner.
 *     tags: [Payment]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-email
 *         required: true
 *         schema:
 *           type: string
 *         description: Parking owner's email address.
 *     responses:
 *       200:
 *         description: Successfully retrieved payment status.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 email:
 *                   type: string
 *                 balance:
 *                   type: number
 *                   description: Current balance of the parking lot owner.
 *                 payment_due:
 *                   type: boolean
 *                   description: Indicates if payment is pending.
 *       400:
 *         description: Missing x-email header.
 *       404:
 *         description: Parking lot owner not found.
 *       500:
 *         description: Server error.
 */
router.get("/status", parkingOwnerAuth, fetchPaymentStatus);

export default router;