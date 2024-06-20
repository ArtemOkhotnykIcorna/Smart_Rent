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
    ctx.reply('Please, authorize by providing your phone number:',
        Markup.keyboard([
            Markup.button.contactRequest('Share Contact')
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

// Хендлер для обробки місцезнаходження
bot.on('location', async (ctx) => {
    const { latitude, longitude } = ctx.message.location;
    const chatId = ctx.message.chat.id;

    try {
        const token = jwt.sign({ chatId }, process.env.JWT_SECRET);
        await saveLocation(chatId, latitude, longitude, token);

        ctx.reply('Location received successfully! You can now create a rental ad or open the Rent App:',
            Markup.removeKeyboard()
        ).then(() => {
            ctx.reply('Choose an option:',
                Markup.keyboard([
                    [{ text: 'Create Ad' }],
                    [{ text: 'Rent App', web_app: { url: `${process.env.MINI_APP_URL}?token=${token}` } }]
                ]).resize().oneTime()
            );
        });
    } catch (error) {
        console.error('Error processing location:', error);
        ctx.reply('Error processing location. Please try again.');
    }
});

// Хендлер для обробки текстових повідомлень
bot.on('text', async (ctx) => {
    const messageText = ctx.message.text;

    if (!ctx.session) {
        ctx.session = {};
    }

    if (messageText === 'Create Ad') {
        ctx.reply('Please enter the address in the format: street, house number, city');
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

            ctx.reply('Photo uploaded successfully! Send another photo or type "done" to finish.');
        } catch (error) {
            console.error('Error uploading photo:', error.message);
            ctx.reply('An error occurred while uploading the photo. Please try again.');
        }
    }
});

// Функція для обробки адреси
async function handleAddress(ctx, address) {
    try {
        const url = `https://nominatim.openstreetmap.org/search?addressdetails=1&q=${encodeURIComponent(address)}&format=json`;
        const response = await axios.get(url);
        const res = response.data;

        if (res.length > 0) {
            const { lat, lon, address } = res[0];
            const { city, state, district } = address;

            // Ініціалізація сесії з отриманими даними
            ctx.session.address = address;
            ctx.session.latitude = lat;
            ctx.session.longitude = lon;
            ctx.session.city = city;
            ctx.session.state = state;
            ctx.session.district = district;

            // Запит типу будинку
            ctx.reply('Select the house type:',
                Markup.keyboard([
                    ['RS', 'KHR', 'PR', 'STL', 'SP']
                ]).resize().oneTime()
            );
            ctx.session.step = 'house_type';
        } else {
            ctx.reply(`Address '${address}' not found.`);
        }
    } catch (error) {
        console.error('Error processing address:', error.message);
        ctx.reply('An error occurred while processing your request.');
    }
}

async function handleHouseType(ctx, houseType) {
    ctx.session.house_type = houseType;
    ctx.reply('Does the house have a balcony?', Markup.keyboard([
        ['Yes', 'No']
    ]).resize().oneTime());
    ctx.session.step = 'balcony';
}

// Функція для обробки наявності балкона
async function handleBalcony(ctx, balcony) {
    ctx.session.balcony = (balcony === 'Yes');
    ctx.reply('Enter the area in square meters:');
    ctx.session.step = 'area';
}

// Функція для обробки площі будинку
async function handleArea(ctx, area) {
    ctx.session.area = parseFloat(area);
    ctx.reply('Enter the floor number:');
    ctx.session.step = 'floor';
}

// Функція для обробки номеру поверху
async function handleFloor(ctx, floor) {
    ctx.session.floor = parseInt(floor, 10);
    ctx.reply('Select the wall type:', Markup.keyboard([
        ['block', 'monolithic', 'panels', 'insulated_panel', 'brick']
    ]).resize().oneTime());
    ctx.session.step = 'walls_type';
}

// Функція для обробки типу стін
async function handleWallsType(ctx, wallsType) {
    ctx.session.walls_type = wallsType;
    ctx.reply('Select the heating type:', Markup.keyboard([
        ['autonomous', 'individual', 'centralized']
    ]).resize().oneTime());
    ctx.session.step = 'heating';
}

// Функція для обробки типу опалення
async function handleHeating(ctx, heating) {
    ctx.session.heating = heating;
    ctx.reply('Enter the number of rooms:');
    ctx.session.step = 'rooms';
}

// Функція для обробки кількості кімнат
async function handleRooms(ctx, rooms) {
    ctx.session.rooms = parseInt(rooms, 10);
    ctx.reply('Is the house suitable for children?', Markup.keyboard([
        ['Yes', 'No']
    ]).resize().oneTime());
    ctx.session.step = 'children';
}

// Функція для обробки питання про дітей
async function handleChildren(ctx, children) {
    ctx.session.children = (children === 'Yes');
    ctx.reply('Are animals allowed?', Markup.keyboard([
        ['Yes', 'No']
    ]).resize().oneTime());
    ctx.session.step = 'animals';
}

// Функція для обробки питання про тварин
async function handleAnimals(ctx, animals) {
    ctx.session.animals = (animals === 'Yes');
    ctx.reply('Enter the price:');
    ctx.session.step = 'price';
}

// Функція для обробки вартості
async function handlePrice(ctx, price) {
    ctx.session.price = parseFloat(price);
    ctx.reply('Enter a description for the house:');
    ctx.session.step = 'description';
}

// Функція для обробки опису будинку
async function handleDescription(ctx, description) {
    ctx.session.description = description;
    ctx.reply('Please upload photos of the house.');
    ctx.session.step = 'photos';
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
    console.log('Successfully uploaded photo ' + fileName + ' to bucket ' + process.env.S3_BUCKET_NAME);

    // Отримання підписаного URL
    const urlParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileName,
        Expires: 60 * 60 // 1 година
    };
    const signedUrl = s3.getSignedUrl('getObject', urlParams);
    console.log('Signed URL: ', signedUrl);

    return signedUrl;
}

//
bot.launch();
