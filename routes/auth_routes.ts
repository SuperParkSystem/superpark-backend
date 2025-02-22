import express from "express";
import * as driver from "../controllers/driver_controller"
import * as parkingOwner from "../controllers/parkingOwner_controller"

import * as auth from "../middleware/auth_middleware"

const router = express.Router()

/**
 * @openapi
 * /auth/driver:
 *      put:
 *          description: Create a new driver account
 *          requestBody:
 *              content:
 *                  application/json:
 *                      examples:
 *                          basic_example:
 *                              value:
 *                                  email: abc@x.com
 *                                  password: pass123
 *          responses:
 *              201:
 *                  description: Successfully created new driver
 *              400:
 *                  description: Duplicate email or unknown error
 */
router.put('/driver', driver.createPut)

/**
 * @openapi
 * /auth/driver/token:
 *      post:
 *          description: Create a new token for the driver. Token created must be sent with every request
 *          requestBody:
 *              content:
 *                  application/json:
 *                      examples:
 *                          basic_example:
 *                              value:
 *                                  email: abc@x.com
 *                                  password: pass123
 *          responses:
 *              201:
 *                  description: Authenticated
 *                  content:
 *                      application/json:
 *                          schema:
 *                              type: object
 *                              properties:
 *                                  token:
 *                                      type: string
 *                          example:
 *                              token: asfaldghehgqrq==
 *
 *              401:
 *                  description: Bad password or email
 */
router.post('/driver/token', driver.createTokenPost)

router.use('/driver/verify', auth.driverAuth)
router.get('/driver/verify', driver.testToken)

/**
 * @openapi
 * /auth/parkingOwner:
 *      put:
 *          description: Create a new parking owner account
 *          requestBody:
 *              content:
 *                  application/json:
 *                      examples:
 *                          basic_example:
 *                              value:
 *                                  email: abc@x.com
 *                                  password: pass123
 *          responses:
 *              201:
 *                  description: Successfully created new parking owner
 *              400:
 *                  description: Duplicate email or unknown error
 */

router.put('/parkingOwner', parkingOwner.createPut)

/**
 * @openapi
 * /auth/parkingOwner/token:
 *      post:
 *          description: Create a new token for the parkingOwner. Token created must be sent with every request
 *          requestBody:
 *              content:
 *                  application/json:
 *                      examples:
 *                          basic_example:
 *                              value:
 *                                  email: abc@x.com
 *                                  password: pass123
 *          responses:
 *              201:
 *                  description: Authenticated
 *                  content:
 *                      application/json:
 *                          schema:
 *                              type: object
 *                              properties:
 *                                  token:
 *                                      type: string
 *                          example:
 *                              token: asfaldghehgqrq==
 *
 *              401:
 *                  description: Bad password or email
 */

router.post('/parkingOwner/token', parkingOwner.createTokenPost)

router.use('/parkingOwner/verify', auth.parkingOwnerAuth)
router.get('/parkingOwner/verify', parkingOwner.testToken)

export default router;
