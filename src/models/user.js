// db/userModel.js

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    chatId: {
        type: Number,
        required: true,
        unique: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    location: {
        type: { type: String },
        coordinates: []
    },
    jwtToken: {
        type: String
    }
});

userSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', userSchema);
