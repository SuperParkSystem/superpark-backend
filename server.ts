const app = require('./app')
const port = process.env.PORT || '80'

console.log("Listening on port " + port)
app.listen(port)
