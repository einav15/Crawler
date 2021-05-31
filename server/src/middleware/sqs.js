const AWS = require('aws-sdk');
const { all } = require('bluebird');
const { getPagesFromRedis } = require('../middleware/redis');

const sqs = new AWS.SQS({
    apiVersion: "2012-11-05",
    region: process.env.AWS_REGION
})

const queueUrl = "https://sqs.eu-west-1.amazonaws.com/829319593320/scrapeQ.fifo"

// const sendMessageToQueue = async (req, res, next) => {
//     const QueueUrl = queueUrl
//     const MessageBody = JSON.stringify({ url: req.body.url, depth: 0 })
//     const MessageGroupId = "0"
//     const MessageDeduplicationId = Math.floor(1000 * Math.random()) + ""
//     const inRedis = await getPagesFromRedis(req.body.url).catch(e => console.log(e))
//     if (!inRedis)
//         try {
//             await sqs.sendMessage({
//                 QueueUrl,
//                 MessageBody,
//                 MessageGroupId,
//                 MessageDeduplicationId
//             }).promise()
//             next()
//         } catch (e) {
//             console.log(e)
//         }
//     next()
// }

const serverSendMessageToQueue = async (body) => {
    const { QueueUrl, messageBody, MessageGroupId, MessageDeduplicationId } = body
    const MessageBody = JSON.stringify(messageBody)
    let inRedis = null
    await getPagesFromRedis(messageBody.url, (data) => inRedis = data)
    if (!inRedis)
        try {
            await sqs.sendMessage({
                QueueUrl,
                MessageBody,
                MessageGroupId,
                MessageDeduplicationId
            }).promise()
        } catch (e) {
            console.log(e)
        }
}

const serverCheckMessages = async () => {
    let remain
    try {
        await sqs.getQueueAttributes({
            QueueUrl: queueUrl, AttributeNames: ["ApproximateNumberOfMessages"]
        }, (e, res) => {
            remain = res.Attributes.ApproximateNumberOfMessages > 0
        }).promise()

        return remain
    } catch (e) {
        console.log(e)
    }
}

module.exports = {
    serverSendMessageToQueue,
    serverCheckMessages,
    queueUrl
}