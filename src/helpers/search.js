const House = require('../models/house'); // Підключаємо модель House

// Приклад пошуку по всім полям за умови, що введена строка міститься у будь-якому з полів
async function searchHouse(queryString) {
    try {
        const regex = new RegExp(queryString, 'i'); // 'i' для ігнорування регістру

        const results = await House.find({
            $or: [
                { address: { $regex: regex } },
                { description: { $regex: regex } },
                { city: { $regex: regex } },
                { district: { $regex: regex } }
            ]
        }).exec();
        return results;
    } catch (error) {
        console.error('Error searching houses:', error);
        throw error;
    }
}

module.exports = { searchHouse }
// searchHouse('Львів')
//     .then(results => console.log('Результати пошуку:', results))
//     .catch(error => console.error('Помилка пошуку:', error));
