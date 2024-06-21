require('dotenv').config(); // Підключаємо dotenv
const { Telegraf, Markup, session, InputFile } = require('telegraf'); // Додано InputFile для завантаження фото
const AWS = require('aws-sdk'); // Підключаємо AWS SDK
const jwt = require('jsonwebtoken');
const { saveUser, saveLocation } = require('../../db');
const axios = require('axios');
const NodeGeocoder = require('node-geocoder');
const createHouseBot = require('../controller/rent/index');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Конфігурація AWS S3
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

// Використання сесійного middleware
bot.use(session());

// Конфігурація геокодера
const geocoderOptions = {
    provider: 'openstreetmap'
};
const geocoder = NodeGeocoder(geocoderOptions);

// Ініціалізація сесії, якщо вона відсутня
bot.use((ctx, next) => {
    if (!ctx.session) {
        ctx.session = {};
    }
    return next();
});

// Хендлер старту бота
bot.start((ctx) => {
    ctx.reply('Будь ласка, авторизуйтесь, надаючи свій номер телефону:',
        Markup.keyboard([
            Markup.button.contactRequest('Поділитися контактом')
        ]).resize().oneTime()
    );
});

// Хендлер для обробки контакту
bot.on('contact', async (ctx) => {
    const { phone_number, first_name, last_name } = ctx.message.contact;
    const chatId = ctx.message.chat.id;
    const realtor = `${first_name} ${last_name}`.trim();

    try {
        const token = await saveUser({
            chatId: chatId,
            phoneNumber: phone_number,
            userName: realtor
        });

        ctx.session = {};
        ctx.session.realtor = realtor;
        ctx.session.realtorPhone = phone_number;

        ctx.reply('Авторизація успішна! Тепер, будь ласка, надайте своє місцезнаходження:',
            Markup.keyboard([
                Markup.button.locationRequest('Поділитися місцезнаходженням')
            ]).resize().oneTime()
        );
    } catch (error) {
        console.error('Помилка збереження користувача:', error);
        ctx.reply('Помилка. Будь ласка, спробуйте ще раз.');
    }
});

// Хендлер для обробки місцезнаходження
bot.on('location', async (ctx) => {
    const { latitude, longitude } = ctx.message.location;
    const chatId = ctx.message.chat.id;

    try {
        const token = jwt.sign({ chatId }, process.env.JWT_SECRET);
        await saveLocation(chatId, latitude, longitude, token);

        ctx.reply('Місцезнаходження успішно отримано! Ви можете створити оголошення про оренду або відкрити додаток для оренди:',
            Markup.removeKeyboard()
        ).then(() => {
            ctx.reply('Виберіть опцію:',
                Markup.keyboard([
                    [{ text: 'Створити оголошення' }],
                    [{ text: 'Додаток для оренди', web_app: { url: `${process.env.MINI_APP_URL}?token=${token}` } }]
                ]).resize().oneTime()
            );
        });
    } catch (error) {
        console.error('Помилка обробки місцезнаходження:', error);
        ctx.reply('Помилка обробки місцезнаходження. Будь ласка, спробуйте ще раз.');
    }
});

// Хендлер для обробки текстових повідомлень
bot.on('text', async (ctx) => {
    const messageText = ctx.message.text;

    if (!ctx.session) {
        ctx.session = {};
    }

    if (messageText === 'Створити оголошення') {
        ctx.reply('Будь ласка, введіть адресу у форматі: вулиця, номер будинку, місто');
        ctx.session.step = 'address';
    } else if (ctx.session.step === 'address') {
        await handleAddress(ctx, messageText);
    } else if (ctx.session.step === 'house_type') {
        await handleHouseType(ctx, messageText);
    } else if (ctx.session.step === 'balcony') {
        await handleBalcony(ctx, messageText);
    } else if (ctx.session.step === 'area') {
        await handleArea(ctx, messageText);
    } else if (ctx.session.step === 'floor') {
        await handleFloor(ctx, messageText);
    } else if (ctx.session.step === 'walls_type') {
        await handleWallsType(ctx, messageText);
    } else if (ctx.session.step === 'heating') {
        await handleHeating(ctx, messageText);
    } else if (ctx.session.step === 'rooms') {
        await handleRooms(ctx, messageText);
    } else if (ctx.session.step === 'children') {
        await handleChildren(ctx, messageText);
    } else if (ctx.session.step === 'animals') {
        await handleAnimals(ctx, messageText);
    } else if (ctx.session.step === 'price') {
        await handlePrice(ctx, messageText);
    } else if (ctx.session.step === 'description') {
        await handleDescription(ctx, messageText);
    } else if (ctx.session.step === 'photos' && messageText === 'Готово') {
        await handleFinish(ctx);
    }
});

// Хендлер для обробки фото
bot.on('photo', async (ctx) => {
    if (!ctx.session) {
        ctx.session = {};
    }

    if (ctx.session.step === 'photos') {
        const photo = ctx.message.photo.pop();
        const fileId = photo.file_id;
        const fileUrl = await ctx.telegram.getFileLink(fileId);
        const fileName = `house_photos/${fileId}.jpg`;

        try {
            const response = await axios.get(fileUrl.href, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data, 'binary');
            const photoUrl = await uploadPhoto(buffer, fileName);

            if (!ctx.session.photos) {
                ctx.session.photos = [];
            }
            ctx.session.photos.push(photoUrl);

            ctx.reply('Фото успішно завантажено! Надішліть ще одне фото або натисніть "Готово", щоб завершити.',
                Markup.keyboard([
                    ['Готово']
                ]).resize().oneTime()
            );
        } catch (error) {
            console.error('Помилка завантаження фото:', error.message);
            ctx.reply('Сталася помилка при завантаженні фото. Будь ласка, спробуйте ще раз.');
        }
    }
});

// Функція для обробки адреси
async function handleAddress(ctx, address) {
    try {
        const url = `https://nominatim.openstreetmap.org/search?addressdetails=1&q=${encodeURIComponent(address)}&format=json`;
        ctx.session.address = address;
        const response = await axios.get(url);
        const res = response.data;

        if (res.length > 0) {
            const { lat, lon, address } = res[0];
            const { city, state, suburb } = address;

            ctx.session.latitude = lat;
            ctx.session.longitude = lon;
            ctx.session.city = city;
            ctx.session.state = state;
            ctx.session.district = suburb;

            ctx.reply('Оберіть тип будинку:',
                Markup.keyboard([
                    ['RS', 'KHR', 'PR', 'STL', 'SP']
                ]).resize().oneTime()
            );
            ctx.session.step = 'house_type';
        } else {
            ctx.reply(`Адреса '${address}' не знайдена.`);
        }
    } catch (error) {
        console.error('Помилка обробки адреси:', error.message);
        ctx.reply('Сталася помилка при обробці вашого запиту.');
    }
}

async function handleHouseType(ctx, houseType) {
    ctx.session.house_type = houseType;
    ctx.reply('Чи є в будинку балкон?', Markup.keyboard([
        ['Так', 'Ні']
    ]).resize().oneTime());
    ctx.session.step = 'balcony';
}

// Функція для обробки наявності балкона
async function handleBalcony(ctx, balcony) {
    ctx.session.balcony = (balcony === 'Так');
    ctx.reply('Введіть площу в квадратних метрах:');
    ctx.session.step = 'area';
}

// Функція для обробки площі будинку
async function handleArea(ctx, area) {
    ctx.session.area = parseFloat(area);
    ctx.reply('Введіть номер поверху:');
    ctx.session.step = 'floor';
}

// Функція для обробки номеру поверху
async function handleFloor(ctx, floor) {
    ctx.session.floor = parseInt(floor, 10);
    ctx.reply('Оберіть тип стін:', Markup.keyboard([
        ['block', 'monolithic', 'panels', 'insulated_panel', 'brick']
    ]).resize().oneTime());
    ctx.session.step = 'walls_type';
}

// Функція для обробки типу стін
async function handleWallsType(ctx, wallsType) {
    ctx.session.walls_type = wallsType;
    ctx.reply('Оберіть тип опалення:', Markup.keyboard([
        ['autonomous', 'individual', 'centralized']
    ]).resize().oneTime());
    ctx.session.step = 'heating';
}

// Функція для обробки типу опалення
async function handleHeating(ctx, heating) {
    ctx.session.heating = heating;
    ctx.reply('Введіть кількість кімнат:');
    ctx.session.step = 'rooms';
}

// Функція для обробки кількості кімнат
async function handleRooms(ctx, rooms) {
    ctx.session.rooms = parseInt(rooms, 10);
    ctx.reply('Чи підходить будинок для дітей?', Markup.keyboard([
        ['Так', 'Ні']
    ]).resize().oneTime());
    ctx.session.step = 'children';
}

// Функція для обробки питання про дітей
async function handleChildren(ctx, children) {
    ctx.session.children = (children === 'Так');
    ctx.reply('Чи дозволені тварини?', Markup.keyboard([
        ['Так', 'Ні']
    ]).resize().oneTime());
    ctx.session.step = 'animals';
}

// Функція для обробки питання про тварин
async function handleAnimals(ctx, animals) {
    ctx.session.animals = (animals === 'Так');
    ctx.reply('Введіть ціну:');
    ctx.session.step = 'price';
}

// Функція для обробки вартості
async function handlePrice(ctx, price) {
    ctx.session.price = parseFloat(price);
    ctx.reply('Введіть опис будинку:');
    ctx.session.step = 'description';
}

// Функція для обробки опису будинку
async function handleDescription(ctx, description) {
    ctx.session.description = description;
    ctx.reply('Будь ласка, завантажте фото будинку.');
    ctx.session.step = 'photos';
}

// Функція для обробки завершення завантаження фото
async function handleFinish(ctx) {
    createHouseBot.createHouseBot(ctx.session)
    ctx.reply('Дякую! Ваше оголошення успішно створено.');
}

// Функція для завантаження фото в S3
async function uploadPhoto(buffer, fileName) {
    const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: 'image/jpeg' // Або інший MIME тип відповідно до типу вашого файлу
    };

    const data = await s3.upload(params).promise();
    console.log('Фото успішно завантажено ' + fileName + ' у bucket ' + process.env.S3_BUCKET_NAME);

    // Отримання підписаного URL
    const urlParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileName,
        Expires: 60 * 60 // 1 година
    };
    const signedUrl = s3.getSignedUrl('getObject', urlParams);
    console.log('Підписаний URL: ', signedUrl);

    return signedUrl;
}

// Запуск бота
bot.launch();
//