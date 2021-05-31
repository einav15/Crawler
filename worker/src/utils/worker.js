const axios = require('axios');
const cheerio = require('cheerio');
const redisClient = require('../db/redis');

const { getScrapedFromRedis } = require('../middleware/redis');

const linkConfirmation = (url) => {
    const pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
    return !!pattern.test(url) ? url : false
}
const scrapeData = async (message, cb) => {
    const seenUrls = {}
    const { url, depth } = message
    const urlChecked = linkConfirmation(url)
    if (urlChecked) {
        seenUrls[url] = true
        await axios.get(url).then((res, rej) => {
            const links = []
            const data = { url, depth }
            const $ = cheerio.load(res.data)
            data.title = $("title").text()
            $('a').toArray().forEach(link => {
                const href = linkConfirmation(link.attribs.href?.trim())
                if (href && !seenUrls[href]) {
                    links.push(href)
                    seenUrls[href] = true
                }
            })
            data.links = links

            return cb(data)
        }).catch(err => {
            console.log(err)
        });
    }
    else cb(null)
}


const sendToRedis = async (d) => {
    const data = {}
    if (d) {
        const { links, title, depth, url } = d
        data.links = []
        data.title = title
        data.depth = depth
        data.url = url
        links?.forEach(link => {
            if (!data.links.includes(link))
                data.links.push(link)
        })
        await redisClient.setexAsync(
            data.url,
            3600,
            JSON.stringify(data)
        )
        await axios.post(`http://localhost:3000/addUrl?url=${url}`)
    }
}

const jobHandling = async (messages) => {
    if (!messages)
        return

    for (const message of messages) {
        let fromRedis
        if (message) {
            try {
                await getScrapedFromRedis(message.url)
                    .then(res => {
                        fromRedis = res
                    })
                if (!fromRedis)
                    await scrapeData(message, (d) => {
                        if (d)
                            sendToRedis(d)
                    })
            } catch (e) {
                console.log("jh - err?", e.status)
            }

        }
    }
}

module.exports = {
    jobHandling
}