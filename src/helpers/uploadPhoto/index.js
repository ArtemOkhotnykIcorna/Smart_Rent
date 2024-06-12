require('dotenv').config();
const fs = require('fs');
const AWS = require('aws-sdk');
const path = require('path');

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    endpoint: 'https://s3.filebase.com',
    signatureVersion: 'v4'
});

const bucketName = process.env.S3_BUCKET_NAME;

function uploadPhoto(bucket, filePath, callback) {
    const fileContent = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);

    const params = {
        Bucket: bucket,
        Key: fileName,
        Body: fileContent,
        ContentType: 'image/jpeg' // Або інший MIME тип відповідно до типу вашого файлу
    };

    s3.putObject(params, function(error, data) {
        if (error) {
            console.error('Upload Error:', error);
            callback(error, null);
        } else {
            console.log('Successfully uploaded photo ' + fileName + ' to bucket ' + bucket);

            // Отримання підписаного URL
            const urlParams = {
                Bucket: bucket,
                Key: fileName,
                Expires: 60 * 60 // 1 година
            };
            const signedUrl = s3.getSignedUrl('getObject', urlParams);
            console.log('Signed URL: ', signedUrl);
            callback(null, signedUrl);
        }
    });
}

function downloadPhoto(bucket, key, outputPath, callback) {
    const params = {
        Key: key,
        Bucket: bucket
    };

    s3.getObject(params, function(error, data) {
        if (error) {
            console.log("Error while reading file " + key + " from bucket " + bucket);
            return callback("Error!");
        } else {
            fs.writeFileSync(outputPath, data.Body);
            console.log("Successfully downloaded photo to " + outputPath);
            return callback(null, outputPath);
        }
    });
}

function listObjects(bucket) {
    const params = {
        Bucket: bucket
    };

    s3.listObjects(params, function(err, data) {
        if (err) {
            console.error('Error listing objects:', err);
        } else {
            console.log('Objects in bucket: ', data.Contents);
        }
    });
}

module.exports = {
    uploadPhoto,
    downloadPhoto,
    listObjects
};

// Приклад використання
const filePath = 'path/to/your/photo.jpg'; // Змініть на шлях до вашого файлу
const downloadPath = 'path/to/save/downloaded/photo.jpg'; // Змініть на шлях для збереження завантаженого файлу

uploadPhoto(bucketName, filePath, (error, signedUrl) => {
    if (error) {
        console.error("Failed to upload the photo.");
    } else {
        console.log("Photo uploaded successfully. Access it here:", signedUrl);
        // Тут ви можете зберегти signedUrl в вашу базу даних
    }
});

downloadPhoto(bucketName, path.basename(filePath), downloadPath, (err, output) => {
    if (err) {
        console.error("Failed to download the photo.");
    } else {
        console.log("Downloaded photo saved to:", output);
    }
});

listObjects(bucketName);
