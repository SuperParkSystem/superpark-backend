import * as productOwner from "../controllers/productOwner_controller"
import * as auth from "../middleware/auth_middleware"

import express from "express"

const router = express.Router()

router.use('/', auth.parkingOwnerAuth)

router.post('/updateBalance', productOwner.addBalancePost)

export default router

/**@openapi
 * openapi: 3.0.0
 * info:
 *   title: Product Owner API
 *   version: 1.0.0
 * tags:
 * - name: Balance
 *   description: Endpoints related to balance management
 * paths:
 *   "/productOwner/updateBalance":
 *     post:
 *       summary: Add balance to a driver
 *       tags:
 *       - Balance
 *       security:
 *       - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *               - amount
 *               - email
 *               properties:
 *                 amount:
 *                   type: number
 *                   example: 50
 *                 email:
 *                   type: string
 *                   example: driver@mail.com
 *       responses:
 *         '200':
 *           description: Balance updated successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   msg:
 *                     type: string
 *                     example: Updated balance
 *         '400':
 *           description: Missing email or amount
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   msg:
 *                     type: string
 *                     example: Missing email or amount
 *         '500':
 *           description: Internal server error
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 */
