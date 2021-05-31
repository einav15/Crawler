const redisClient = require('../db/redis');

const getPagesFromRedis = async (url, cb) => {
    try {
        const pageObj = await redisClient.getAsync(url)
            .catch(e => console.log(e))
        if (pageObj)
            return cb(JSON.parse(pageObj));
        return cb(null)

    } catch (err) {
        console.log(err);
    }
}

module.exports = {
    getPagesFromRedis
};