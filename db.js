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

const saveUser = async (chatId, phoneNumber) => {
    // Перевіряємо, чи існує користувач з цим chatId
    let user = await User.findOne({ chatId });

    // Якщо користувача не знайдено, створюємо нового користувача
    if (!user) {
        user = new User({ chatId, phoneNumber });
    } else {
        user.phoneNumber = phoneNumber;
    }

    // Зберігаємо користувача в базі даних
    await user.save();

    // Генеруємо та зберігаємо токен для користувача
    const token = generateToken(chatId);
    user.jwtToken = token;
    await user.save();

    return token;
};

const saveLocation = async (chatId, latitude, longitude) => {
    // Знаходимо користувача за chatId
    const user = await User.findOne({ chatId });

    if (user) {
        // Оновлюємо локацію користувача
        user.location = {
            type: 'Point',
            coordinates: [longitude, latitude]
        };
        await user.save();
    } else {
        console.error('User not found');
    }
};



module.exports = { saveUser, saveLocation };
