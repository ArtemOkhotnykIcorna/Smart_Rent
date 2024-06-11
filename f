// bot/telegramBot.js

require('dotenv').config(); // Підключаємо dotenv
const { Telegraf } = require('telegraf');
const { saveUser } = require('../../db');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.start((ctx) => {
    // Відправляємо повідомлення з клавіатурою, що містить кнопку для авторизації
    ctx.reply('Please, authorize by providing your phone number:', {
        reply_markup: {
            keyboard: [
                [{ text: "Share Contact", request_contact: true }]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
        }
    });
});

bot.on('contact', async (ctx) => {
    const phoneNumber = ctx.message.contact.phone_number;
    const chatId = ctx.message.chat.id;

    try {
        // Зберігаємо користувача в базі даних
        const token = await saveUser(chatId, phoneNumber);

        // Створюємо посилання для міні-додатка з токеном
        const miniAppLink = `${process.env.MINI_APP_URL}?token=${token}`;

        ctx.reply(`Authorization successful! Click the link to proceed to the mini app: ${miniAppLink}`);
    } catch (error) {
        console.error('Error saving user:', error);
        ctx.reply('Error. Please try again.');
    }
});

bot.launch();
