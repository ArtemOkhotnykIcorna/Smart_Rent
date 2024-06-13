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

function uploadPhoto(buffer, fileName, callback) {
    const params = {
        Bucket: bucketName,
        Key: fileName,
        Body: buffer,
        ContentType: 'image/jpeg' // Або інший MIME тип відповідно до типу вашого файлу
    };

    s3.putObject(params, function(error, data) {
        if (error) {
            console.error('Upload Error:', error);
            callback(error, null);
        } else {
            console.log('Successfully uploaded photo ' + fileName + ' to bucket ' + bucketName);

            // Отримання підписаного URL
            const urlParams = {
                Bucket: bucketName,
                Key: fileName,
                Expires: 60 * 60 // 1 година
            };
            const signedUrl = s3.getSignedUrl('getObject', urlParams);
            console.log('Signed URL: ', signedUrl);
            callback(null, signedUrl);
        }
    });
}

const createHouse = async (req, res) => {
    try {
        const { address, realtor, realtorPhone, prise, prise_currency, description, photo, longitude, latitude, district, house_type, balcony, area, floor, walls_type, heating, rooms, children, animals, city} = req.body;

        if (!address || !realtor || !realtorPhone || !prise || !prise_currency || !description || !photo || !longitude || !latitude || !district || !house_type || ! balcony || ! area || ! floor || ! walls_type || ! heating || ! rooms || ! children || ! animals || ! city) {
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
                photo: signedUrl,
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
                city: city
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
