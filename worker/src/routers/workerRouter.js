const express = require('express');
const { pollMessagesFromQueue } = require('../middleware/sqs');
const { jobHandling } = require('../utils/worker');
const router = new express.Router()

router.post('/scrape', async (req, res) => {
    let messages
    try {
        res.send()
        do {
            await pollMessagesFromQueue(req.query.queueUrl, req.query.max)
                .then((d) => {
                    if (d)
                        messages = d.map(m => JSON.parse(m.Body))
                    else
                        messages = null
                })
            if (!messages)
                break
            await jobHandling(messages)

            if (messages && messages[0].depth === 0) break

        } while (messages != undefined)
    }
    catch (e) {
        console.log(e.message)
    }
});

module.exports = router