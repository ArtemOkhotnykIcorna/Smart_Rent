const router = require('express').Router();
const filterHouse =  require("../controller/filter/index")

router.get('/api/rent/house/prise/:minPrise/:maxPrise', filterHouse.getHomeByPrise);

module.exports = router;