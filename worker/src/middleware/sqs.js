const AWS = require('aws-sdk');


const sqs = new AWS.SQS({
    apiVersion: "2012-11-05",
    region: process.env.AWS_REGION
})

// const pollMessagesFromQueue = async (req, res, next) => {
//     const QueueUrl = req.query.queueUrl
//     try {
//         const { Messages } = await sqs.receiveMessage({
//             QueueUrl,
//             MaxNumberOfMessages: 3,
//             MessageAttributeNames: [
//                 "All"
//             ],
//             VisibilityTimeout: 1,
//             WaitTimeSeconds: 0
//         }).promise()
//         req.messages = Messages

//         if (Messages) {
//             const messageDeletionFuncs = Messages.map(message => {
//                 return sqs.deleteMessage({
//                     QueueUrl,
//                     ReceiptHandle: message.ReceiptHandle
//                 }).promise()
//             })

//             Promise.allSettled(messageDeletionFuncs)
//             // .then(d => console.log(d))
//         }

//         next()

//     } catch (e) {
//         console.log(e)
//     } 
// }

const pollMessagesFromQueue = async (QueueUrl, MaxNumberOfMessages = 3) => {
    try {
        const { Messages } = await sqs.receiveMessage({
            QueueUrl,
            MaxNumberOfMessages,
            MessageAttributeNames: [
                "All"
            ],
            VisibilityTimeout: 1,
            WaitTimeSeconds: 1
        }).promise()
        if (Messages) {
            const messageDeletionFuncs = Messages.map(message => {
                return sqs.deleteMessage({
                    QueueUrl,
                    ReceiptHandle: message.ReceiptHandle
                }).promise()
            })

            Promise.allSettled(messageDeletionFuncs)
            // .then(d => console.log(d))
        }
        console.log(Messages?.map((m) => m.Body))
        return Messages

    } catch (e) {
        console.log(e)
    }
}

// const serverCheckMessages = async (QueueUrl) => {
//     let remain
//     try {
//         await sqs.getQueueAttributes({
//             QueueUrl,
//             AttributeNames: [
//                 "ApproximateNumberOfMessages"
//             ]
//         }, (e, res) => {
//             remain = res.Attributes.ApproximateNumberOfMessages > 0
//         }).promise()
//         return remain
//     } catch (e) {
//         console.log(e)
//     }
// }


module.exports = {
    pollMessagesFromQueue
}