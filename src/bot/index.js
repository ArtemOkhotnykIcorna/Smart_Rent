// bot/telegramBot.js

require('dotenv').config(); // Підключаємо dotenv
const { Telegraf, Markup } = require('telegraf');
const jwt = require('jsonwebtoken');
const { saveUser, saveLocation } = require('../../db');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.start((ctx) => {
    ctx.reply('Please, authorize by providing your phone number:',
        Markup.keyboard([
            Markup.button.contactRequest('Share Contact')
        ]).resize().oneTime()
    );
});

bot.on('contact', async (ctx) => {
    const phoneNumber = ctx.message.contact.phone_number;
    const chatId = ctx.message.chat.id;

    try {
        // Зберігаємо користувача в базі даних
        await saveUser(chatId, phoneNumber);

        // Після успішної авторизації запитуємо геолокацію
        ctx.reply('Authorization successful! Now, please share your location:',
            Markup.keyboard([
                Markup.button.locationRequest('Share Location')
            ]).resize().oneTime()
        );
    } catch (error) {
        console.error('Error saving user:', error);
        ctx.reply('Error. Please try again.');
    }
});

// Обробляємо отримання геолокації
bot.on('location', async (ctx) => {
    const latitude = ctx.message.location.latitude;
    const longitude = ctx.message.location.longitude;
    const chatId = ctx.message.chat.id;

    try {
        const token = jwt.sign({ chatId }, process.env.JWT_SECRET);

        await saveLocation(chatId, latitude, longitude);

        ctx.reply('Location received successfully! Redirecting to mini app...', {
            reply_markup: {
                inline_keyboard: [
                    [{text: 'Rent App', web_app: {url: `${process.env.MINI_APP_URL}?token=${token}`}}]
                ]
            }
        });

    } catch (error) {
        console.error('Error processing location:', error);
        ctx.reply('Error processing location. Please try again.');
    }
});

bot.launch();
