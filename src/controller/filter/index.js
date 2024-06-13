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

const getHomeByObl = async (req, res) => {
    try{
        const { obl } = req.params

        const house = await House.findOne({obl: obl})
        res.status(200).json(house)
    }
    catch (error) {
        console.error('Error occurred:', error.message);
        res.status(500).json({ error: 'Server error' });
    }

}

module.exports = {
    getHomeByPrise,
    getHomeByObl
};
