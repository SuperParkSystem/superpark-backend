import express from "express";
import * as driver from "../controllers/driver_controller"
import * as parkingOwner from "../controllers/parkingOwner_controller"

import * as auth from "../middleware/auth_middleware"

const router = express.Router()

/** @openapi
 *  /driver/startSession:
 *      put:
 *          description: Start a new parking session
 *          parameters:
 *              - in: query
 *                name: parking
 *                description: parking owner email
 *          responses:
 *              200:
 *                  description: Success
 *                  content:
 *                      application/json:
 *                          example:
 *                              lat: 123.124
 *                              lon: -123.23
 *              501:
 *                  description: Internal error
 *              401:
 *                  description: Invalid authentication
 *              400:
 *                  description: Unknown driver or session already exists
 *                  content:
 *                      application/json:
 *                          example:
 *                             lat: 123.5345346
 *                             lon: -12312.235
 *                             startTime: 08:23 UTC 23 July
 */
router.put('/startSession', driver.startSessionPut)

export default router;
