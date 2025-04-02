import * as productOwner from "../controllers/productOwner_controller";
import * as auth from "../middleware/auth_middleware";
import express from "express";

const router = express.Router();

// Apply authentication middleware
router.use('/', auth.parkingOwnerAuth);

// Existing route to update balance
router.post('/updateBalance', productOwner.addBalancePost);

// New route to get all parking lot ratings
router.get('/parkingLotRatings', productOwner.getParkingLotRatings);

// New route to get parking lot ratings by owner email
router.get('/parkingLotRatings/:ownerEmail', productOwner.getParkingLotRatingsByOwnerEmail);

router.get('/visualization/data', auth.driverAuth, productOwner.getVisualizationData as express.RequestHandler);

router.get('/notifications', auth.driverAuth, productOwner.getNotifications);


export default router;

/**@openapi
 * openapi: 3.0.0
 * info:
 *   title: Product Owner API
 *   version: 1.0.0
 * tags:
 * - name: Balance
 *   description: Endpoints related to balance management
 * - name: Ratings
 *   description: Endpoints related to parking lot ratings
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
 *   "/productOwner/parkingLotRatings":
 *     get:
 *       summary: Get average ratings for all parking lots
 *       tags:
 *       - Ratings
 *       security:
 *       - bearerAuth: []
 *       responses:
 *         '200':
 *           description: Successfully fetched parking lot ratings
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   data:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         parking_owner_email:
 *                           type: string
 *                           example: owner1@example.com
 *                         total_ratings:
 *                           type: number
 *                           example: 10
 *                         average_rating:
 *                           type: number
 *                           example: 4.5
 *         '500':
 *           description: Internal server error
 *   "/productOwner/parkingLotRatings/{ownerEmail}":
 *     get:
 *       summary: Get parking lot ratings by owner email
 *       tags:
 *       - Ratings
 *       security:
 *       - bearerAuth: []
 *       parameters:
 *       - name: ownerEmail
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: owner1@example.com
 *       responses:
 *         '200':
 *           description: Successfully fetched parking lot ratings for the owner
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   data:
 *                     type: object
 *                     properties:
 *                       total_ratings:
 *                         type: number
 *                         example: 10
 *                       average_rating:
 *                         type: number
 *                         example: 4.5
 *                       feedback_details:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             driver_email:
 *                               type: string
 *                               example: driver1@example.com
 *                             feedback:
 *                               type: string
 *                               example: Great parking lot!
 *                             rating:
 *                               type: number
 *                               example: 5
 *                             status:
 *                               type: string
 *                               example: resolved
 *         '500':
 *           description: Internal server error
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 */