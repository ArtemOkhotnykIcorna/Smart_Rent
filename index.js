require('dotenv').config();
require('./src/bot/index');
const MongoStore = require('connect-mongo');
const db = require('./db');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const app = express();
const rent = require("./src/routers/rent")
const user = require("./src/routers/user")
const formatsLogger = app.get('env') === 'development' ? 'dev' : 'short';

const PORT = process.env.PORT || 4001;
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header(
        'Access-Control-Allow-Headers',
        'X-Requested-With, X-HTTP-Method-Override, Content-Type, Content-Length, Accept, Authorization, Platform, DeviceUID, DeviceMac, X-CSRF-Token'  // Added CSRF header
    );
    next();
});
app.use(logger(formatsLogger));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.static('Images'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(rent);
app.use(user);

app.get('/', (req, res) => {
    res.send('Telegram bot is running!');
});


app.listen(PORT, () => {
    console.log(`Server start ${PORT}`);
});
