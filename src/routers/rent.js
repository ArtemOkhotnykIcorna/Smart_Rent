const router = require('express').Router();
const house =  require("../controller/rent/index")

router.post('/api/rent/house', house.createHouse);
router.get('/api/rent/house', house.getAllHouse);
router.get('/api/rent/house/:id', house.findHouseById);



module.exports = router;