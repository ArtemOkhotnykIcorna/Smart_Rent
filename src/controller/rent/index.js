const House = require("../../models/house")
const createHouse = async (req, res) => {
    try{
        const {address, realtor, realtorPhone, prise, prise_currency, description, photo, longitude, latitude} = req.body;
        if (!address || !realtor || !realtorPhone || !prise || !prise_currency || !description || !photo ) {
            throw HttpError(400, " is required in the request body");
        }

        const hous = new House({
            address:  address,
            realtor: realtor,
            realtorPhone: realtorPhone,
            prise: prise,
            prise_currency: prise_currency,
            description: description,
            photo: photo,
            longitude: longitude,
            latitude: latitude
        });
        await hous.save();
        console.log("Created new house");
        res.status(201).json(hous);
    }catch (error){
        res.status(400);
    }
};

const getAllHouse = async (req, res) => {
    let hous = await House.find();
    return res.status(200).json({ success: true, hous });
}

const findHouseById = async (req, res) => {
    const id_house = req.params.id;
    const houseById = await House.findById(id_house);
    return res.status(200).json({ success: true, houseById });
}


module.exports = {
    createHouse,
    getAllHouse,
    findHouseById
};
