const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = 3003
const db = require('./queries')
const auth = require('./auth');

app.use(bodyParser.json())
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
)

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


app.get('/', (request, response) => {
    response.json({ info: 'Node.js, Express, and Postgres API' })
})

app.get('/categories', db.getCategories)
app.get('/user', db.getUserByEmail)
app.get('/users', db.getUsers)
app.get('/projects/:username/:orgName/:teamName/:projName', db.getProjectDetails)
app.post('/signup', db.signup)
app.post('/start', db.startProject)
app.post('/login', db.login)
app.delete('/users/:email', db.deleteUser)

app.listen(port, () => {
    console.log(`App running on port ${port}.`)
})