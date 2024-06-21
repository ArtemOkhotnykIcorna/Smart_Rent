const House = require('../../models/house');
const searchHouse = require('../../helpers/search')


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
        const count = await House.countDocuments({ obl: obl });

        const houses = await House.find({ obl: obl })
            .skip(Number(offset))
            .limit(Number(limit));


        resul = {houses, count}
        res.status(200).json(resul);
    } catch (error) {
        console.error('Error occurred:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
};

const getHomeByCity = async (req, res) => {
    try {
        const { city } = req.params;
        const { limit = 200, offset = 0 } = req.query;

        const count = await House.countDocuments({ city: city });
        const houses = await House.find({ city: city })
            .skip(Number(offset))
            .limit(Number(limit));
        resul = {houses, count}
        res.status(200).json(resul);
    } catch (error) {
        console.error('Error occurred:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
};

const fastSearch = async (req, res) => {
    try {
        const { text } = req.params;
        const { limit = 200, offset = 0 } = req.query;
        const regex = new RegExp(text, 'i'); // 'i' для ігнорування регістру

        const results = await House.find({
            $or: [
                { address: { $regex: regex } },
                { description: { $regex: regex } },
                { city: { $regex: regex } },
                { district: { $regex: regex } }
            ]
        }).skip(Number(offset)).limit(Number(limit)).exec()
            ;
        console.log(results)
        res.status(200).json(results);
    }
    catch (error) {
        console.error('Error occurred:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
}


module.exports = {
    getHomeByPrise,
    getHomeByObl,
    getHomeByCity,
    fastSearch
}