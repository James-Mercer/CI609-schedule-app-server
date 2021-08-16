require('dotenv').config()
const fs = require("fs")
const express = require('express')
const app = express()
const http = require('http')
const https = require('https');
const cors = require("cors")

app.use(cors())

const sequelize = require("sequelize")
const db = require("./config/database.js")

let credentials = null
try{
  const certificate = fs.readFileSync('../ssl/certs/jm1320_brighton_domains_ef324_58331_1630540799_10f3c2add0557b0e846e81e8871e916f.crt', 'utf8');
  const privateKey = fs.readFileSync('../ssl/keys/ef324_58331_4172117a8c89cf22a5ef525a99f559cc.key', 'utf8');
  const credentials = { key: privateKey, cert: certificate}
} catch (err) {
  console.log(err)
}

db.authenticate()
  .then(() => console.log("connected to db"))
  .catch((err) => console.log(err))

app.use(express.urlencoded({
  extended: false
}));
app.use(express.json())
app.use("/scheduler/api", require('./routes/schedule_routes.js'))

const httpPort = process.env.HTTP_SERVER_PORT || 8080
const httpsPort = process.HTTPS_SERVER_PORT || 8443

const httpServer = http.createServer(app)
httpServer.listen(httpPort)

if(credentials) { 
  const httpsServer = https.createServer(credentials, app)
  httpsServer.listen(httpsPort)
}
