require('dotenv').config();
const fs = require('fs');
const AWS = require('aws-sdk');
const path = require('path');
const House  = require('../../models/house');

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    endpoint: 'https://s3.filebase.com',
    signatureVersion: 'v4'
});

const bucketName = process.env.S3_BUCKET_NAME;


// Функція для завантаження фото в S3
async function uploadPhoto(buffer, fileName) {
    const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: 'image/jpeg' // Або інший MIME тип відповідно до типу вашого файлу
    };

    const data = await s3.upload(params).promise();
    console.log('Successfully uploaded photo ' + fileName + ' to bucket ' + process.env.S3_BUCKET_NAME);

    // Отримання підписаного URL
    const urlParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileName,
        Expires: 60 * 60 // 1 година
    };
    const signedUrl = s3.getSignedUrl('getObject', urlParams);
    console.log('Signed URL: ', signedUrl);

    return signedUrl;
}


const createHouse = async (req, res) => {
    try {
        const { address, realtor, realtorPhone, prise, prise_currency, description, photo, district, house_type, balcony, area, floor, walls_type, heating, rooms, children, animals, city, obl} = req.body;

        if (!address || !realtor || !realtorPhone || !prise || !prise_currency || !description || !photo || !district || !house_type || ! balcony || ! area || ! floor || ! walls_type || ! heating || ! rooms || ! children || ! animals || ! city || !obl) {
            return res.status(400).json({ message: "All fields are required in the request body" });
        }

        const photoBuffer = Buffer.from(photo, 'base64');
        const fileName = `${Date.now()}-${address}.jpg`;

        uploadPhoto(photoBuffer, fileName, async (error, signedUrl) => {
            if (error) {
                return res.status(500).json({ message: "Error uploading photo" });
            }

            const house = new House({
                address: address,
                realtor: realtor,
                realtorPhone: realtorPhone,
                prise: prise,
                prise_currency: prise_currency,
                description: description,
                photo: photo,
                longitude: longitude,
                latitude: latitude,
                district: district,
                house_type: house_type,
                balcony: balcony,
                area: area,
                floor: floor,
                walls_type: walls_type,
                heating: heating,
                rooms: rooms,
                children: children,
                animals: animals,
                city: city,
                obl: obl,
                statusHome: "create"
            });

            await house.save();
            console.log("Created new house");
            res.status(201).json(house);
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getAllHouse = async (req, res) => {
    try {
        let hous = await House.find();
        return res.status(200).json({ success: true, hous });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

const findHouseById = async (req, res) => {
    const id_house = req.params.id;
    const houseById = await House.findById(id_house);
    return res.status(200).json({ success: true, houseById });
}



const createHouseBot = async (houseData) => {
    try {
        const house = new House({
            address: houseData.address, //готово
            realtor: houseData.realtor,//готово
            realtorPhone: houseData.realtorPhone,//готово
            prise: houseData.prise,//готово
            prise_currency: "UAH",//готово
            description: houseData.description, //готово
            photos: houseData.photos,
            longitude: houseData.longitude, //готово
            latitude: houseData.latitude,//готово
            district: houseData.district,//готово
            house_type: houseData.house_type,//готово
            balcony: houseData.balcony,//готово
            area: houseData.area,//готово
            floor: houseData.floor,//готово
            walls_type: houseData.walls_type,//готово
            heating: houseData.heating,//готово
            rooms: houseData.rooms,//готово
            children: houseData.children,//готово
            animals: houseData.animals,//готово
            city: houseData.city,//готово
            obl: houseData.obl,//готово
            statusHome: "create"//готово
        });

        await house.save();
        console.log("Created new house");

        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};


module.exports = {
    createHouse,
    getAllHouse,
    findHouseById,
    createHouseBot,
    uploadPhoto
};
