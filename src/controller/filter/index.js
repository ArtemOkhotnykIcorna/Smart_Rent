const House  = require('../../models/house');

const getHomeByPrise = async (req, res) => {
    try {
        const { minPrise, maxPrise}  = req.params

        const houses = await House.find({
            prise: {
                $gte: Number(minPrise),
                $lte: Number(maxPrise)
            }
        });
        res.status(200).json(houses);
    } catch (error) {
        console.error('Error occurred:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
};

const getHomeByCity = async (req, res) => {
    try{
        const { city } = req.params

        const house = await House.findOne({city: city})
        res.status(200).json(house)
    }
    catch (error) {
        console.error('Error occurred:', error.message);
        res.status(500).json({ error: 'Server error' });
    }

}

module.exports = {
    getHomeByPrise,
    getHomeByCity
};
