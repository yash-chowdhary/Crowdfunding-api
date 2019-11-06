const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors');
const app = express()
const process = require('process');
const port = process.env.PORT;
const db = require('./queries')
const auth = require('./auth');
const path = require('path');

app.use(bodyParser.json())
app.use(cors());
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
)

// app.use(function (req, res, next) {
//     res.header("Access-Control-Allow-Origin", "http://localhost:3000"); // update to match the domain you will make the request from
//     res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     next();
// });


// app.get('/', (request, response) => {
//     response.json({ info: 'Node.js, Express, and Postgres API' })
// })

app.get('/api/v1/allprojects', db.getAllProjects)
app.get('/api/v1/categories', db.getCategories)
app.get('/api/v1/comments/:creator/:orgname/:teamname/:projname', db.getComments)
app.get('/api/v1/getFeaturedProjects', db.getFeaturedProjects)
app.get('/api/v1/searchProjects/:searchString', db.searchProjects)
app.get('/api/v1/user/:username', db.getUserByUsername)
app.get('/api/v1/users', db.getUsers)
app.get('/api/v1/projects/:username/:orgName/:teamName/:projName', db.getProjectDetails)
app.get('/api/v1/test', db.testEndpoint);
app.post('/api/v1/comment', db.comment)
app.post('/api/v1/editProject', db.editProject)
app.post('/api/v1/fund', db.fundProject)
app.post('/api/v1/follow', db.followProject)
app.post('/api/v1/setStatus', db.setProjectStatus)
app.post('/api/v1/signup', db.signup)
app.post('/api/v1/start', db.startProject)
app.post('/api/v1/login', db.login)
app.post('/api/v1/withdraw', db.withdraw)
app.delete('/api/v1/comment/:commentor/:timestamp', db.deleteComment)
app.delete('/api/v1/follow/:follower/:creator/:orgname/:teamname/:projname', db.unfollowProject)
app.delete('/api/v1/project/:username/:orgname/:teamname/:projname', db.deleteProject)
app.delete('/api/v1/users/:username', db.deleteUser)

app.use(express.static(path.join(__dirname, 'build')));

// Serve the build
app.get('*', function(req, res) {
    console.log('Website');
    console.log(path.join(__dirname, 'build'))
    res.sendFile('index.html', {root: path.join(__dirname, 'build')});
});
// app.use('/css', express.static(__dirname + '/public/css'));
// app.use('/js', express.static(__dirname + '/public/js'));
// app.use('/images', express.static(__dirname + '/public/images'));
  

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${port}.`)
})