var bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const exjwt = require('express-jwt');
const config = require('./config')

const Pool = require('pg').Pool
const pool = new Pool({
    user: 'yash',
    host: 'localhost',
    database: 'crowdfunding',
    port: 5432,
    password: 'password',
})

const deleteUser = (request, response) => {
    const email = (request.params.email)
    console.log(email);
    pool.query('DELETE FROM users WHERE email = $1', [email], (error, results) => {
        if (error) {
            console.log(error)
            response.status(500).json(error)
        } else {
            console.log(results);
            response.status(200).send(`User deleted with email: ${email}`)
        }
    })
}

const getCategories = (request, response) => {
    pool.query('SELECT * FROM categories', [], (error, result) => {
        if (error) {
            console.log(error)
            response.status(500).json(error)
        } else {
            // console.log(result.rows)
            response.status(200).json(result.rows)
        }
    })
}

const getProjectDetails = (request, response) => {
    var username = request.params.username;
    var orgName = request.params.orgName;
    var teamName = request.params.teamName;
    var projName = request.params.projName;

    console.log(`getting all details for project - ${username}/${orgName}/${teamName}/${projName}`)

    let getProjectStatement = 'SELECT * FROM projects WHERE username = $1 AND orgName = $2 AND teamName = $3 AND projName = $4'
    pool.query(getProjectStatement, [username, orgName, teamName, projName],
        (error, result) => {
            if (result.rows.length == 0) {
                response.status(404).json("Oops, looks like we don't have any such project!")
            } else {
                let data = result.rows;
                let getBackersStatement = 'SELECT * FROM funds WHERE creator = $1 AND orgName = $2 AND teamName = $3 AND projName = $4';
                pool.query(getBackersStatement, [username, orgName, teamName, projName],
                    (error, result) => {
                        if (error) {
                            response.status(500).json("Oops, Something went wrong on our side!")
                        } else {
                            let projObj = data[0];
                            projObj.numbackers = result.rows.length;
                            response.status(200).json(projObj)
                        }
                    })
            }
        })
}

const getUsers = (request, response) => {
    pool.query('SELECT * FROM users ORDER BY name ASC', (error, results) => {
        if (error) {
            response.status(500).send(error)
        } else {
            console.log(results)
            response.status(200).json(results.rows)
        }
    })
}

const getUserByEmail = (request, response) => {
    const email = (request.query.email);
    console.log("Getting details for user with email: ", email)

    pool.query('SELECT * FROM users WHERE email = $1', [email], (err, result) => {
        if (err) {
            response.status(404).json("User not found")
        }
        response.status(200).json(result.rows)
    })
}

const login = (request, res) => {
    const { email, password } = request.body;
    console.log("User submitted: ", email, password);

    pool.query('SELECT * FROM users WHERE email = $1', [email], (err, result) => {
        if (err) {
            console.log("Error here", err)
        }
        if (result.rows.length === 0) {
            res.status(403).json({
                sucess: false,
                token: null,
                err: 'Invalid Credentials'
            });
        } else {
            let userObj = result.rows[0]
            console.log(result)
            bcrypt.compare(password, userObj.password, function (err, result) {
                if (err) {
                    console.log(err)
                }
                if (result === true) {
                    console.log("Valid credentials!");

                    let token = jwt.sign(
                        {
                            name: userObj.name,
                            username: userObj.username
                        },
                        // 'jwtsecret',
                        config.secret,
                        { expiresIn: 129600 }); // Signing the token

                    console.log(token);

                    res.json({
                        sucess: true,
                        err: null,
                        token: token
                    });


                } else {
                    console.log('invalid creds')
                    res.status(401).json({
                        sucess: false,
                        token: null,
                        err: 'Invalid Credentials'
                    });
                }
            })
        }
    })
}

const signup = (request, response) => {
    const { username, name, email, password } = request.body
    console.log(`Signing up ${name} with email ID - ${email} and username ${username}`);

    const saltRounds = 10;
    bcrypt.hash(password, saltRounds, function (err, hash) {
        if (err) {
            console.log(err);
            res.json({
                success: false,
                err: err,
                token
            })
        }
        pool.query('INSERT INTO users (username, name, email, password) VALUES ($1, $2, $3, $4)',
            [username, name, email, hash], (error, result) => {
                if (error) {
                    console.log(error)
                    response.status(500).json(error)
                } else {
                    console.log(result)
                    response.status(201).json("User added")
                }
            })
    });
}

const startProject = (request, response) => {
    const { team, title, description, goal, deadline, category, orgName, username } = request.body;

    // insert into teams table
    pool.query('INSERT INTO teams (username, teamName, orgName) values ($1, $2, $3) ON CONFLICT DO NOTHING',
        [username, team, orgName], (error, result) => {
            if (error) {
                console.log(error);
                response.status(500).json(error)
            } else {
                let selectTupleStatement = 'SELECT * FROM projects WHERE username = $1 AND teamName = $2 AND orgName = $3 AND projName = $4';
                pool.query(selectTupleStatement, [username, team, orgName, title], (error, result) => {
                    if (error) {
                        console.log(error);
                        response.status(500).json(error);
                    } else if (result.rows.length > 0) {
                        response.status(400).json("You\'ve already created a project with this name")
                    } else {
                        let insertStatement = 'INSERT INTO projects VALUES ($1,$2,$3,$4,$5,$6,$7,$8)'
                        pool.query(insertStatement, [username, team, orgName, title, description, category, deadline, goal],
                            (error, result) => {
                                if (error) {
                                    console.log(error);
                                    response.status(500).json("Oops, something went wrong. Please try again!s")
                                } else {
                                    console.log("Project added");
                                    response.status(200).json("Project added")
                                }
                            })
                    }
                })
            }
        })
}



module.exports = {
    getUsers,
    signup,
    deleteUser,
    login,
    getUserByEmail,
    getCategories,
    startProject,
    getProjectDetails
}