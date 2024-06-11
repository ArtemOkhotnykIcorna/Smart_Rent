/*
* Вулиця
Власник
Номер власника
Фото квартири
Ціна
Опис
*
*
* */


// db/userModel.js

const mongoose = require('mongoose');

const House = new mongoose.Schema({
    address: {
        type: String,
        required: true,
    },
    realtor: {
        type: String,
        required: true
    },
    realtorPhone: {
        type: String ,
        required: true
    },
    prise: {
        type: Number
    },
    prise_currency: {
        type: String
    },
    description: {
        type: String,
        required: true
    },
    photo: {
        type: Array,
        required: true
    },
    latitude: {
        type: Number
    },
    longitude: {
        type: Number
    }
});

module.exports = mongoose.model('House', House);
