// db/userModel.js

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    chatId: {
        type: Number,
    },
    phoneNumber: {
        type: String,
    },
    location: {
        type: { type: String },
        coordinates: []
    },
    jwtToken: {
        type: String
    },
    username: {
        type: String
    }
});

userSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', userSchema);
