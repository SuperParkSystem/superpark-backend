import express from "express"
import cors from "cors"

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'SuperPark Backend API',
            version: '0.1.0',
        }
    },
    apis: ['./routes/driver_routes.ts', './routes/auth_routes.ts', './routes/parkingOwner_routes.ts']
}

const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = swaggerJSDoc(options);

import auth_router from "./routes/auth_routes"
import driver_router from "./routes/driver_routes"
import { driverAuth, parkingOwnerAuth } from "./middleware/auth_middleware"
import parkingOwner_router from "./routes/parkingOwner_routes"

const port = process.env.PORT || '80'
console.log("Listening on port " + port)

var app = express()

app.use("/", cors())

app.use("/", express.json())
app.use("/auth", auth_router)

app.use('/driver', driverAuth)
app.use('/driver', driver_router)

app.use('/parkingOwner', parkingOwnerAuth)
app.use('/parkingOwner', parkingOwner_router)

app.use('/raw-docs', express.static('./docs'))

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(port)
