import express from "express";
import * as driver from "../controllers/driver_controller"
import * as parkingOwner from "../controllers/parkingOwner_controller"

import * as auth from "../middleware/auth_middleware"

const router = express.Router()

router.put('/driver', driver.createPut)

router.post('/driver/token', driver.createTokenPost)

router.use('/driver/verify', auth.driverAuth)
router.get('/driver/verify', driver.testToken)

router.put('/parkingOwner', parkingOwner.createPut)

router.post('/parkingOwner/token', parkingOwner.createTokenPost)

router.use('/parkingOwner/verify', auth.parkingOwnerAuth)
router.get('/parkingOwner/verify', parkingOwner.testToken)

export default router;

/**@openapi
 * openapi: 3.0.3
 * info:
 *   title: Authentication API
 *   description: API for driver and parking owner registration and authentication
 *   version: 1.0.0
 * servers:
 * - url: https://api.example.com
 *   description: Production server
 * paths:
 *   "/auth/driver":
 *     put:
 *       tags:
 *       - Auth
 *       summary: Register a new driver
 *       description: Registers a new driver with an email and password.
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *               - email
 *               - password
 *               properties:
 *                 email:
 *                   type: string
 *                   format: email
 *                   example: driver@example.com
 *                 password:
 *                   type: string
 *                   format: password
 *                   example: securepassword123
 *       responses:
 *         '201':
 *           description: Driver created successfully
 *         '400':
 *           description: Bad request (missing fields or driver already exists)
 *   "/auth/driver/token":
 *     post:
 *       tags:
 *       - Auth
 *       summary: Authenticate a driver
 *       description: Authenticates a driver and returns an access token.
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *               - email
 *               - password
 *               properties:
 *                 email:
 *                   type: string
 *                   format: email
 *                   example: driver@example.com
 *                 password:
 *                   type: string
 *                   format: password
 *                   example: securepassword123
 *       responses:
 *         '201':
 *           description: Authentication successful, token returned
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   token:
 *                     type: string
 *                     example: eyJhbGciOiJIUzI1...
 *         '400':
 *           description: Bad request (missing fields)
 *         '401':
 *           description: Unauthorized (invalid credentials)
 *   "/auth/parkingOwner":
 *     put:
 *       tags:
 *       - Auth
 *       summary: Register a new parking owner
 *       description: Registers a new parking owner with an email and password.
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *               - email
 *               - password
 *               properties:
 *                 email:
 *                   type: string
 *                   format: email
 *                   example: owner@example.com
 *                 password:
 *                   type: string
 *                   format: password
 *                   example: securepassword123
 *       responses:
 *         '201':
 *           description: Parking owner created successfully
 *         '400':
 *           description: Bad request (missing fields or parking owner already exists)
 *   "/auth/parkingOwner/token":
 *     post:
 *       tags:
 *       - Auth
 *       summary: Authenticate a parking owner
 *       description: Authenticates a parking owner and returns an access token.
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *               - email
 *               - password
 *               properties:
 *                 email:
 *                   type: string
 *                   format: email
 *                   example: owner@example.com
 *                 password:
 *                   type: string
 *                   format: password
 *                   example: securepassword123
 *       responses:
 *         '201':
 *           description: Authentication successful, token returned
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   token:
 *                     type: string
 *                     example: eyJhbGciOiJIUzI1...
 *         '400':
 *           description: Bad request (missing fields)
 *         '401':
 *           description: Unauthorized (invalid credentials)
 */
