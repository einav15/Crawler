const axios = require('axios');

const { getPagesFromRedis } = require('../middleware/redis');
const { serverSendMessageToQueue } = require('../middleware/sqs');
const { Node, Tree } = require('../utils/tree')
const { queueUrl } = require('../middleware/sqs');

let tree, scraped, pagesLeft, rootUrl
let maxDepth, pagesToInsert, messagesSent = 0
const numberOfWorkers = 3

const isDepthDoneScraping = async (depth) => {
    const depthNodes = tree.bfsTraverse().filter((node) => node.data.depth === depth)
    for (const node of depthNodes) {
        if (!scraped[node.data.url])
            return
    }
    for (const node of depthNodes) {
        await insertChildrenToNode(node)
        await sendLinksMessagesToQueue(node)
    }
    await sendWorkerRequests()
}

const messageId = (url) => {
    if (url.length > 127)
        return url.substring(0, 128)
    return url
}

const returnTree = () => {
    const bfsTree = tree.bfsTraverse()
    return {
        root: bfsTree[0],
        dataArr: bfsTree.map(node => node.data)
    }
}

const sendWorkerRequests = async () => {
    const maxMessages = messagesSent / numberOfWorkers % 1 == 0 && messagesSent !== 0 ? messagesSent / numberOfWorkers : Math.floor(messagesSent / numberOfWorkers) + 1
    await axios.all([
        axios.post(`http://localhost:8000/scrape?queueUrl=${queueUrl}&max=${maxMessages}`),
        axios.post(`http://localhost:8001/scrape?queueUrl=${queueUrl}&max=${maxMessages}`),
        axios.post(`http://localhost:8002/scrape?queueUrl=${queueUrl}&max=${maxMessages}`)
    ]).then((res) => res)
}

const insertChildrenToNode = async (node) => {
    if (!node)
        return
    const links = node.data.links
    const depth = node.data.depth + 1
    if (links && depth <= maxDepth)
        for (const link of links) {
            if (pagesToInsert > 0 && !scraped[link]) {
                let data
                pagesToInsert--
                await getPagesFromRedis(link, (d) => data = d)
                if (!data)
                    data = {
                        url: link,
                        depth
                    }
                else {
                    scraped[link] = true
                    scraped[link + "/"] = true
                }
                const child = new Node(data)
                node.addChildNode(child)
            }
        }
    await isDepthDoneScraping(depth)
}

const sendLinksMessagesToQueue = async (node) => {
    messagesSent = 0
    const links = node.data.links
    const depth = node.data.depth + 1
    const inTree = tree.bfsTraverse().map(n => n.data.url)
    if (depth <= maxDepth && links)
        for (const link of links) {
            if (pagesLeft > 0 && !scraped[link] && inTree.includes(link)) {
                pagesLeft--
                let redisData = null
                await getPagesFromRedis(link, (data) => redisData = data)
                if (!redisData) {
                    const MessageDeduplicationId = messageId(link)
                    await serverSendMessageToQueue({
                        QueueUrl: queueUrl,
                        messageBody: { url: link, depth },
                        MessageGroupId: depth + "",
                        MessageDeduplicationId
                    }).then((res) => messagesSent++)
                }
            }
        }
}

const setRoot = async (root) => {
    tree.setRoot(root)
    scraped[root.data.url] = true
    pagesLeft--
    pagesToInsert--
    if (root.data.url[root.data.url.length - 1] !== '/')
        scraped[root.data.url + "/"] = true
    await insertChildrenToNode(root)
    await sendLinksMessagesToQueue(root)
    await sendWorkerRequests()
}

const receiveScrapedFromWorker = async (url) => {
    let data
    await getPagesFromRedis(url, d => data = d)
    if (data) {
        if (url === rootUrl)
            await setRoot(new Node(data))
        else {
            tree.insertDataToNode(data)
            const { url, depth } = data
            scraped[url] = true
            if (url[url.length - 1] !== '/')
                scraped[url + "/"] = true
            await isDepthDoneScraping(depth)
        }
    }

}

const scrape = async (url, maximumDepth, maxNumOfPages) => {
    rootUrl = url
    maxDepth = maximumDepth
    scraped = {}
    pagesLeft = pagesToInsert = maxNumOfPages ? maxNumOfPages : 10
    tree = new Tree()
    try {
        let rootInRedis
        await getPagesFromRedis(url, (data) => rootInRedis = data)
        let root = null
        if (rootInRedis) {
            root = new Node(rootInRedis)
            await setRoot(root)
        } else {
            const MessageDeduplicationId = messageId(url)
            await serverSendMessageToQueue({
                QueueUrl: queueUrl,
                messageBody: { url, depth: 0 },
                MessageGroupId: "0",
                MessageDeduplicationId
            }).then((res) => res)
            //send worker req
            await sendWorkerRequests(true)
                .then((res) => res)
        }
    } catch (e) {
        console.log(e)
    }
}

module.exports = {
    scrape,
    receiveScrapedFromWorker,
    returnTree
}

