const app = require("express")()
const account = require("./account")

module.exports = app.use(account);