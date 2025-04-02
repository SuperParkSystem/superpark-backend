import express from "express";
import * as driver from "../controllers/driver_controller"
import * as parkingOwner from "../controllers/parkingOwner_controller"

import * as auth from "../middleware/auth_middleware"

const router = express.Router()

router.put('/session/start', driver.startSessionPut)

router.put('/session/stop', driver.stopSessionPut)

router.post('/session/pay', driver.paySessionPost)

router.get('/balance', driver.getBalanceGet)

router.get('/session', driver.getSessions)

router.post('/password', driver.changePasswordPost)

router.get('/', driver.getProfileGet)

router.get('/parking/rates', driver.getRates)

router.get('/get-location/:driverId', driver.getParkedLocation);

export default router;

/**
 * @openapi
 * "/driver/session/start":
 *   put:
 *     summary: Start a parking session
 *     description: Starts a new parking session for the driver. The request must include
 *       an authentication Bearer token.
 *     tags:
 *     - Session
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - in: query
 *       name: parkingOwnerEmail
 *       required: true
 *       schema:
 *         type: string
 *       description: The email of the parking owner.
 *     responses:
 *       '201':
 *         description: Successfully created a new session.
 *         content:
 *           application/json:
 *             example:
 *               sessionID: abc123
 *               lat: 37.7749
 *               lon: -122.4194
 *               startTime: '2025-02-24T12:34:56Z'
 *       '400':
 *         description: Bad request (e.g., missing parameters or session already exists).
 *         content:
 *           application/json:
 *             example:
 *               msg: Session exists
 *       '401':
 *         description: Unauthorized request.
 *       '501':
 *         description: Internal server error.
 * "/driver/session/stop":
 *   put:
 *     summary: Stop a parking session
 *     description: Stops an active parking session for the driver. The request must
 *       include an authentication Bearer token.
 *     tags:
 *     - Session
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - in: query
 *       name: parkingOwnerEmail
 *       required: true
 *       schema:
 *         type: string
 *       description: The email of the parking owner.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionID:
 *                 type: string
 *           example:
 *             sessionID: abc123
 *     responses:
 *       '200':
 *         description: Successfully stopped the session.
 *         content:
 *           application/json:
 *             example:
 *               duration: 3600
 *               totalAmount: 20.5
 *               penaltyAmount: 5.0
 *       '400':
 *         description: Bad request.
 *         content:
 *           application/json:
 *             example:
 *               msg: Error stopping session
 *       '401':
 *         description: Unauthorized request.
 *       '404':
 *         description: Session not found or already stopped.
 *       '500':
 *         description: Internal server error.
 * "/driver/session/pay":
 *   post:
 *     summary: Pay for a parking session
 *     description: Processes the payment for an active parking session.
 *     tags:
 *     - Payment
 *     security:
 *     - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionID:
 *                 type: string
 *           example:
 *             sessionID: abc123
 *     responses:
 *       '200':
 *         description: Payment successful.
 *         content:
 *           application/json:
 *             example:
 *               totalAmount: 20.5
 *               penaltyAmount: 5.0
 *       '400':
 *         description: Bad request (e.g., missing parameters or insufficient funds).
 *         content:
 *           application/json:
 *             example:
 *               msg: Missing request body
 *       '401':
 *         description: Unauthorized request.
 *       '500':
 *         description: Internal server error.
 * "/driver/balance":
 *   get:
 *     summary: Get account balance
 *     description: Retrieves the current balance of the driver.
 *     tags:
 *     - Balance
 *     security:
 *     - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Successfully retrieved balance.
 *         content:
 *           application/json:
 *             example:
 *               balance: 20.5
 *       '401':
 *         description: Unauthorized request.
 *       '500':
 *         description: Internal server error.
 * "/driver/session":
 *   get:
 *     summary: Get active session details
 *     description: Retrieves the active session details for a driver based on the provided email header.
 *     tags:
 *     - Session
 *     security:
 *     - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Active session found.
 *         content:
 *           application/json:
 *             example:
 *               duration: 120
 *               sessionID: "abc123xyz"
 *               startTime: "2025-02-27T12:00:00Z"
 *               lat: 12.9716
 *               lon: 77.5946
 *       "404":
 *         description: No active sessions found.
 *         content:
 *           application/json:
 *             example:
 *               msg: "No active sessions"
 *       "500":
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             example:
 *               msg: "Unknown error"
 * "/driver/password":
 *   post:
 *     summary: Change password
 *     description: Changes the password of the driver based on the provided email header.
 *     tags:
 *     - Profile
 *     security:
 *     - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             oldPassword: "oldPass"
 *             newPassword: "newPass"
 *     responses:
 *       "200":
 *         description: Password changed successfully.
 *       "400":
 *         description: Bad request (e.g., missing parameters).
 *         content:
 *           application/json:
 *             example:
 *               msg: "Missing params oldPassword or newPassword"
 *       "401":
 *         description: Unauthorized request.
 *         content:
 *           application/json:
 *             example:
 *               msg: "Incorrect password"
 *       "500":
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             example:
 *               msg: "Unknown error"
 * "/driver/":
 *   get:
 *     summary: Get driver profile
 *     description: Retrieves the profile information of the driver.
 *     tags:
 *     - Profile
 *     security:
 *     - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Successfully retrieved driver profile.
 *         content:
 *           application/json:
 *             example:
 *               email: "john.doe@example.com"
 *               balance: 123.45
 *       "401":
 *         description: Unauthorized request.
 *       "500":
 *         description: Internal server error.
 * 
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: SessionToken
 */
