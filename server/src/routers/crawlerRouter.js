const express = require('express')
const { queueUrl } = require('../middleware/sqs');
const { returnTree, scrape, receiveScrapedFromWorker } = require('../utils/crawl');

const router = new express.Router()

router.post('/start', async (req, res) => {
    const { url, maxDepth, maxPages } = req.body
    try {
        res.send()
        await scrape(url, maxDepth, maxPages, queueUrl)
    } catch (err) {
        console.log(err.message);
    }
})

router.get('/getTree', async (req, res) => {
    try {
        const treeArray = returnTree()
        res.send(treeArray)
    } catch (err) {
        res.status(500).send(err.message);
    }
})

router.post('/addUrl', async (req, res) => {
    const url = req.query.url
    try {
        res.send()
        await receiveScrapedFromWorker(url)
    } catch (err) {
        console.log(err);
    }
})

module.exports = router