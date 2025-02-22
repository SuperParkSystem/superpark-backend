import express from "express"

const swaggerJSDoc = require('swagger-jsdoc')
const swaggerUI = require("swagger-ui-express")

import auth_router from "./routes/auth_routes"

const swoptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'SuperPark API',
            version: '0.1.0'
        }
    },
    apis: ['./routes/auth_routes.ts']
}

const openapiSpecification = await swaggerJSDoc(swoptions)

const port = process.env.PORT || '80'
console.log("Listening on port " + port)

var app = express()

app.use("/", express.json())
app.use("/auth", auth_router)

app.use("/docs", swaggerUI.serve, swaggerUI.setup(openapiSpecification))

console.log(app._router.stack)

app.listen(port)

