const House = require('../../models/house');

const getHomeByPrise = async (req, res) => {
    try {
        const { minPrise, maxPrise } = req.params;
        const { limit = 200, offset = 0 } = req.query;

        const houses = await House.find({
            prise: {
                $gte: Number(minPrise),
                $lte: Number(maxPrise)
            }
        })
            .skip(Number(offset))
            .limit(Number(limit));

        res.status(200).json(houses);
    } catch (error) {
        console.error('Error occurred:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
};

const getHomeByObl = async (req, res) => {
    try {
        const { obl } = req.params;
        const { limit = 200, offset = 0 } = req.query;

        const houses = await House.find({ obl: obl })
            .skip(Number(offset))
            .limit(Number(limit));

        res.status(200).json(houses);
    } catch (error) {
        console.error('Error occurred:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
};

const getHomeByCity = async (req, res) => {
    try {
        const { city } = req.params;
        const { limit = 200, offset = 0 } = req.query;

        const houses = await House.find({ city: city })
            .skip(Number(offset))
            .limit(Number(limit));

        res.status(200).json(houses);
    } catch (error) {
        console.error('Error occurred:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    getHomeByPrise,
    getHomeByObl,
    getHomeByCity
};
