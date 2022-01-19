var express = require('express')
var router = express.Router()

router.use("/users", require("./routes/usersRoute"))
router.use("/resto", require("./routes/restoRoute"))

module.exports = router
