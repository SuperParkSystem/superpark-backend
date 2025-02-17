import express from "express"

import auth_router from "./routes/auth_routes"

const port = process.env.PORT || '80'
console.log("Listening on port " + port)

var app = express()

app.use("/", express.json())
app.use("/auth", auth_router)

console.log(app._router.stack)

app.listen(port)
