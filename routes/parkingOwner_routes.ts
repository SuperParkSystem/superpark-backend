import express from "express";
import * as parkingOwner from "../controllers/parkingOwner_controller"

import * as auth from "../middleware/auth_middleware"

const router = express.Router()

router.use('/', auth.parkingOwnerAuth)

router.get('/payment', parkingOwner.verifyPaymentGet)

router.get('/balance', parkingOwner.getBalanceGet)

router.get('/paymentPolicy', parkingOwner.getPaymentPolicy)

router.post('/paymentPolicy', parkingOwner.postPaymentPolicy)

export default router

/**@openapi
 * openapi: 3.0.0
 * info:
 *   title: Parking Owner API
 *   version: 1.0.0
 * tags:
 * - name: Payment
 *   description: Endpoints related to payments and balances
 * paths:
 *   "/parkingOwner/payment":
 *     get:
 *       summary: Verify payment status
 *       tags:
 *       - Payment
 *       security:
 *       - bearerAuth: []
 *       parameters:
 *       - name: sessionID
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *       responses:
 *         '200':
 *           description: Payment verification status
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   verified:
 *                     type: boolean
 *         '400':
 *           description: Missing sessionID
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   msg:
 *                     type: string
 *                     example: Missing sessionID
 *         '404':
 *           description: Session does not exist
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   msg:
 *                     type: string
 *                     example: Session does not exist
 *         '500':
 *           description: Internal server error
 *   "/parkingOwner/balance":
 *     get:
 *       summary: Get account balance
 *       tags:
 *       - Payment
 *       security:
 *       - bearerAuth: []
 *       responses:
 *         '200':
 *           description: User balance information
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   balance:
 *                     type: number
 *         '500':
 *           description: Internal server error
 *   "/parkingOwner/paymentPolicy":
 *     get:
 *       summary: Get payment policy
 *       tags:
 *       - Payment
 *       security:
 *       - bearerAuth: []
 *       responses:
 *         '200':
 *           description: Payment policy information
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   paymentPolicy:
 *                     type: string
 *         '500':
 *           description: Internal server error
 *     post:
 *       summary: Update payment policy
 *       tags:
 *       - Payment
 *       security:
 *       - bearerAuth: []
 *       parameters:
 *       - name: value
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *       responses:
 *         '201':
 *           description: Payment policy updated
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   msg:
 *                     type: string
 *                     example: Updated
 *         '400':
 *           description: Invalid or missing query parameter
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   msg:
 *                     type: string
 *                     example: Query param "value" is missing or must be an integer
 *         '500':
 *           description: Internal server error
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 */
