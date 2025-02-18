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
