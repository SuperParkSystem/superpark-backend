import express from "express";
import * as driver from "../controllers/driver_controller"
import * as parkingOwner from "../controllers/parkingOwner_controller"

import * as auth from "../middleware/auth_middleware"

const router = express.Router()

/**
 * @openapi
 * /driver/startSession:
 *   put:
 *     summary: Start a parking session
 *     description: Starts a new parking session for the driver. The request must include an authentication Bearer token.
 *     tags:
 *       - Session
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: parkingOwnerEmail
 *         required: true
 *         schema:
 *           type: string
 *         description: The email of the parking owner.
 *     responses:
 *       201:
 *         description: Successfully created a new session.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionID:
 *                   type: string
 *                   description: The ID of the created session.
 *                 lat:
 *                   type: number
 *                   format: float
 *                   description: Latitude of the session start location.
 *                 lon:
 *                   type: number
 *                   format: float
 *                   description: Longitude of the session start location.
 *                 startTime:
 *                   type: string
 *                   format: date-time
 *                   description: The timestamp when the session started.
 *             example:
 *               sessionID: "abc123"
 *               lat: 37.7749
 *               lon: -122.4194
 *               startTime: "2025-02-24T12:34:56Z"
 *       400:
 *         description: Bad request (e.g., missing parameters or session already exists).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Session exists"
 *       401:
 *         description: Unauthorized request (invalid or missing Bearer token).
 *       501:
 *         description: Internal server error or unknown error.
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: SessionToken
 */
router.put('/startSession', driver.startSessionPut)



/**
 * @openapi
 * /driver/stopSession:
 *   put:
 *     summary: Stop a parking session
 *     description: Stops an active parking session for the driver. The request must include an authentication Bearer token.
 *     tags:
 *       - Session
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: parkingOwnerEmail
 *         required: true
 *         schema:
 *           type: string
 *         description: The email of the parking owner.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionID:
 *                 type: string
 *                 description: The ID of the session to stop.
 *           example:
 *             sessionID: "abc123"
 *     responses:
 *       200:
 *         description: Successfully stopped the session.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 duration:
 *                   type: number
 *                   description: The duration of the session in seconds.
 *             example:
 *               duration: 3600
 *       400:
 *         description: Bad request (e.g., missing parameters).
 *       401:
 *         description: Unauthorized request (invalid or missing Bearer token).
 *       404:
 *         description: Session not found or already stopped.
 *       500:
 *         description: Internal server error.
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: SessionToken
 */
router.put('/stopSession', driver.stopSessionPut)

export default router;
