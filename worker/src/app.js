const express = require('express')
const cors = require('cors')

const workerRouter = require('./routers/workerRouter');

const app = express()

app.use(cors())
app.use(express.json())
app.use(workerRouter)

app.use("/", (req, res) => {
    res.send(req.query);
});

module.exports = app


