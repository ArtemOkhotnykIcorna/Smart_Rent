// db/index.js

const mongoose = require('mongoose');
const User = require('./src/models/user');
const jwt = require('jsonwebtoken');

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

const generateToken = (chatId) => {
    // Генеруємо та підписуємо JWT токен
    return jwt.sign({ chatId }, process.env.JWT_SECRET);
};

async function saveUser(userData) {
    try {
        const existingUser = await User.findOne({ chatId: userData.chatId });
        if (existingUser) {
            existingUser.phoneNumber = userData.phoneNumber;
            existingUser.username = userData.userName;
            await existingUser.save();
            // Генерація JWT токена
            const token = jwt.sign({ chatId: existingUser.chatId }, process.env.JWT_SECRET);
            return token;
        } else {
            const user = new User({
                chatId: userData.chatId,
                phoneNumber: userData.phoneNumber,
                username: userData.userName
            });
            await user.save();
            const token = jwt.sign({ chatId: user.chatId }, process.env.JWT_SECRET);
            return token;
        }
    } catch (error) {
        console.error('Error saving user:', error);
        throw error;
    }
}

const saveLocation = async (chatId, latitude, longitude, token) => {
    // Знаходимо користувача за chatId
    const user = await User.findOne({ chatId });

    if (user) {
        // Оновлюємо локацію користувача
        user.location = {
            type: 'Point',
            coordinates: [longitude, latitude]
        };
        user.jwtToken = token;
        await user.save();
    } else {
        console.error('User not found');
    }
};

module.exports = { saveUser, saveLocation };
