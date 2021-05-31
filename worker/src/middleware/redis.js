const redisClient = require('../db/redis');

// redisClient.flushdb(function (err, succeeded) {
//     console.log(succeeded); // will be true if successfull
// });

redisClient.keys('*', (err, log_list) => {
    console.log(log_list)
})

const getScrapedFromRedis = async (url) => {
    try {
        if (url) {
            const pageObj = await redisClient.getAsync(url)
            if (pageObj)
                return JSON.parse(pageObj);
        }
        return null
    } catch (err) {
        console.log(err);
    }
}

module.exports = {
    getScrapedFromRedis
};