const router = require('express').Router();
const filterHouse =  require("../controller/filter/index")

router.get('/api/rent/house/prise/:minPrise/:maxPrise', filterHouse.getHomeByPrise);
router.get('/api/rent/house/obl/:obl', filterHouse.getHomeByObl);
router.get('/api/rent/house/city/:city', filterHouse.getHomeByCity);

module.exports = router;