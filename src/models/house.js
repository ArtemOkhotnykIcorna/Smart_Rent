// db/userModel.js
// road: { type: String },
// suburb: { type: String },
// borough: { type: String },
// city: { type: String },
// municipality: { type: String },
// district: { type: String },
// state: { type: String },
// ISO3166_2_lvl4: { type: String },
// postcode: { type: String },
// country: { type: String },
// country_code: { type: String }
const mongoose = require('mongoose');
const { nanoid } = require('nanoid');
//
const houseSchema = new mongoose.Schema({
    address: {
        type: String,
    },
    realtor: {
        type: String,
    },
    realtorPhone: {
        type: String,
    },
    price: {
        type: Number
    },
    price_currency: {
        type: String
    },
    description: {
        type: String,
    },
    photos: {
        type: Array,
    },
    latitude: {
        type: Number
    },
    longitude: {
        type: Number
    },
    city: {
        type: String,
    },
    district: {
        type: String,
    },
    house_type: {
        type: String,
        enum: ['RS', 'KHR', 'PR', 'STL', 'SP'],
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
        enum: ["autonomous", "individual", "centralized"],
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

module.exports = mongoose.model('House', houseSchema);
