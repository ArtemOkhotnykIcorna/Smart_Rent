/*
* Місто:
Район:
  ЖК або Тип будинку: хрущівка, дореволюційний, сталінка
Балкон: так/ні
Опис: !!!Доступний в карточці квартири!!!
Площа: м квадратні
Поверх:
Тип стін: блочні, монолітно-каркасний, панелі, утеплена панель, цегляний будинок
Опалення: автономне, індивідуальне, централізоване
Кімнати: (спальні, дитяча, кухня, гардеробна, санвузли, ванна) кількість
Техніка: пральна машина, мікрохвильова піч, порохотяг, телевізор,  посудомийна машина.
Діти:
Тварини:
Ціна: гривня/доллар (зробити фільтрацію від і до)
*
*
* */


// db/userModel.js

const mongoose = require('mongoose');

const House = new mongoose.Schema({
    address: { //;
        type: Object,
    },
    realtor: { //;
        type: String,
    },
    realtorPhone: { //;
        type: String ,
    },
    prise: {
        type: Number
    },
    prise_currency: {
        type: String
    },
    description: {
        type: String,
    },
    photo: {
        type: Array,
    },
    latitude: { //;
        type: Number
    },
    longitude: { //;
        type: Number
    },


    city: { //y
        type: String,
    },
    //Район є
    district: { //District House_type Balcony Area Floor Walls_type Heating Rooms Children Animals
        type: String,
    },
    house_type: {
        type: String,
        enum: ['RS', 'KHR', 'PR', 'STL', 'SP'],
        //Residential complex, хрушовка, дореволюційна, Сталінка, спец. проєкт
    },
    balcony: {
        type: Boolean
    },
    area: {
        type: Number
    },
    floor: {
        type: Number
    },
    walls_type: {
        type: String,
        enum: ["block", "monolithic", "panels", "insulated_panel", "brick"],
    },
    heating: {
        type: String,
        enum: ["autonomous", "individual", "centralized", "insulated_panel", "brick"],
    },
    rooms: {
        type: Number
    },
    children: {
        type: Boolean
    },
    animals: {
        type: Boolean
    },
    obl: {
        type: String
    },

    statusHome: {
        type: String,
        enum: ["create", "public"],
    }

});

module.exports = mongoose.model('House', House);
