const express = require('express')
const cors = require('cors')
const crawlerRouter = require('./routers/crawlerRouter');

const app = express()


app.use(express.json())
app.use(cors())
app.use(crawlerRouter)

// app.use("/", (req, res) => {
//     res.send("ok");
// });


module.exports = {
    app
}


