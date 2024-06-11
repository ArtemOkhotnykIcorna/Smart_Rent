const router = require('express').Router();
const user =  require("../controller/user/index")

router.get('/api/user/:user_token', user.getUser);

module.exports = router;