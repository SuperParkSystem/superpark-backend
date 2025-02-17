import express from "express";
import bodyParser from "body-parser";
import * as driver from "../controllers/driver_controller"

const router = express.Router()

router.put('/driver', driver.createPut)

router.post('/driver/token', driver.createTokenPost)

router.put('/parkingOwner', (req, res) => {
    // Create a parking owner
})

export default router;
