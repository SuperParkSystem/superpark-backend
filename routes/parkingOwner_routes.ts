import express from "express";
import * as parkingOwner from "../controllers/parkingOwner_controller"

import * as auth from "../middleware/auth_middleware"

const router = express.Router()

router.use('/', auth.parkingOwnerAuth)

router.get('/payment', parkingOwner.verifyPaymentGet)

router.get('/balance', parkingOwner.getBalanceGet)

export default router
