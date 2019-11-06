var bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const exjwt = require('express-jwt');
const config = require('./config');
const { simplePool, pool } = require('./db-pool');
var moment = require('moment')

// const pool = new Pool({
//     user: 'yash',
//     host: 'localhost',
//     database: 'crowdfunding',
//     port: 5432,
//     password: 'password',
// })

// promise - checkout a client
// pool
//     .connect()
//     .then(client => {
//         return client
//             .query('SELECT * FROM categories;')
//             .then(res => {
//                 client.release()
//                 console.log(res.rows)
//             })
//             .catch(e => {
//                 client.release()
//                 console.log(err.stack)
//             })
//     })

const testEndpoint = (req, res) => {
    const client = new Client({
        connectionString: "postgres://wywokfmlqazmmc:b1f1aae0b657507ddd077d7e65989a0a09d18556fb7a4bf276de5d0013dd9e1a@ec2-46-137-113-157.eu-west-1.compute.amazonaws.com:5432/del0jbnikff315",
        ssl: true
    });

    client.connect();

    client.query('select * from categories;', (error, response) => {
        res.end(JSON.stringify(response));
        client.end();
    })
}

const comment = (request, response) => {
    const { commentor, creator, orgname, teamname, projname, comment } = request.body;
    console.log(`${commentor} is commenting on ${projname}`);

    const timestamp = moment().unix();
    console.log(timestamp);
    pool.then(client => {
        const insertCommentQuery = 'INSERT INTO usercomments (commentor, timestamp, comment, creator, orgname, teamname, projname) VALUES ($1, $2, $3, $4, $5, $6, $7)'
        const insertCommentValues = [commentor, timestamp, comment, creator, orgname, teamname, projname]
        return client.query(insertCommentQuery, insertCommentValues,
            (err, result) => {
                if (err) {
                    response.status(500).json('Error creating a comment')
                } else {
                    response.status(200).json('Comment added.')
                }
            })
    })

}

const deleteComment = (request, response) => {
    const { commentor, timestamp } = request.params;
    console.log(`Deleting ${commentor}'s comment at ${timestamp}`);

    pool.then(client => {
        const deleteCommentQuery = 'DELETE FROM usercomments WHERE commentor = $1 AND timestamp = $2'
        const deleteCommentValues = [commentor, timestamp]
        return client.query(deleteCommentQuery, deleteCommentValues,
            (err, result) => {
                if (err) {
                    console.log(err);
                    response.status(500).json('Error deleting comment')
                } else {
                    console.log(result);
                    response.status(200).json('Comment deleted')
                }
            })
    })

}

const deleteProject = (request, response) => {
    const { username, orgname, teamname, projname } = request.params
    console.log(`Deleting project - ${username}/${orgname}/${teamname}/${projname}`);

    pool.then(client => {
        const deleteProjectQuery = 'DELETE FROM projects where username = $1 AND orgname = $2 AND teamname = $3 AND projname = $4'
        const deleteProjectQueryValues = [username, orgname, teamname, projname]
        return client.query(deleteProjectQuery, deleteProjectQueryValues,
            (err, result) => {
                if (err) {
                    response.status(500).json('Error deleting project')
                } else {
                    response.status(200).json('Project deleted.')
                }
            })
    })

}

const deleteUser = (request, response) => {
    const username = (request.params.username)
    console.log(username);
    pool.then(client => {
        return client.query('DELETE FROM users WHERE email = $1', [username], (error, results) => {
            if (error) {
                console.log(error)
                response.status(500).json(error)
            } else {
                console.log(results);
                response.status(200).send(`User deleted with username: ${username}`)
            }
        })
    })
}

const editProject = (request, response) => {
    const { username, orgname, teamname, projname, about } = request.body
    console.log(`Setting ${projname}'s about field to "${about}"`);

    pool.then(client => {
        const editProjQuery = 'UPDATE projects SET about = $1 WHERE username = $2 AND orgname = $3 AND teamname = $4 AND projname = $5'
        const editProjValues = [about, username, orgname, teamname, projname]
        return client.query(editProjQuery, editProjValues,
            (err, result) => {
                if (err) {
                    response.status(500).json('Error updating projects table')
                } else {
                    console.log('Project updated');
                    response.status(200).json('Project updated!')
                }
            })
    })

}

const getCategories = (request, response) => {
    pool.then(client => {
        return client.query('SELECT * FROM categories', [], (error, result) => {
            if (error) {
                console.log(error)
                response.status(500).json(error)
            } else {
                // console.log(result.rows)
                response.status(200).json(result.rows)
            }
        })
    })
}

const getComments = (request, response) => {
    const { creator, orgname, teamname, projname } = request.params
    console.log(`getting comments for ${projname}`);

    pool.then(client => {
        const getCommentsQuery = 'SELECT commentor, timestamp, comment FROM usercomments WHERE creator = $1 AND orgname = $2 AND teamname = $3 AND projname = $4 ORDER BY timestamp DESC'
        const getCommentsValues = [creator, orgname, teamname, projname]
        return client.query(getCommentsQuery, getCommentsValues,
            (err, result) => {
                if (err) {
                    response.status(400).json('Not Found')
                } else {
                    console.log(result.rows);
                    response.status(200).json(result.rows)
                }
            })
    })

}

const getProjectDetails = (request, response) => {
    var username = request.params.username;
    var orgName = request.params.orgName;
    var teamName = request.params.teamName;
    var projName = request.params.projName;

    console.log(`getting all details for project - ${username}/${orgName}/${teamName}/${projName}`)

    let getProjectStatement = 'SELECT * FROM projects WHERE username = $1 AND orgname = $2 AND teamname = $3 AND projname = $4'
    pool.then(client => {
        return client.query(getProjectStatement, [username, orgName, teamName, projName],
            (error, result) => {
                if (result.rows.length == 0) {
                    response.status(404).json("Oops, looks like we don't have any such project!")
                } else {
                    let data = result.rows;
                    let getBackersStatement = 'SELECT * FROM funds WHERE creator = $1 AND orgName = $2 AND teamName = $3 AND projName = $4';
                    client.query(getBackersStatement, [username, orgName, teamName, projName],
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
    })
}

const getUsers = (request, response) => {
    pool.then(client => {
        return client.query('SELECT * FROM users ORDER BY name ASC', (error, results) => {
            if (error) {
                response.status(500).send(error)
            } else {
                console.log(results)
                response.status(200).json(results.rows)
            }
        })
    })
}

const getUserByEmail = (request, response) => {
    const email = (request.query.email);
    console.log("Getting details for user with email: ", email)

    pool.then(client => {
        return client.query('SELECT * FROM users WHERE email = $1', [email], (err, result) => {
            if (err) {
                response.status(404).json("User not found")
            } else {
                response.status(200).json(result.rows)
            }
        })
    })
}

const getUserByUsername = (request, response) => {
    // return user details, projects created, projects backed, and projects followed
    const username = (request.params.username);
    console.log("Getting details for user with username: ", username)
    pool.then(client => {
        return client.query('SELECT * FROM users WHERE username = $1', [username], (err, result) => {
            if (err) {
                response.status(404).json("User not found")
            } else {
                var data = result.rows[0]
                console.log(data);
                const selectCreatedProjQuery = 'SELECT * FROM users NATURAL JOIN projects WHERE users.username = $1'
                client.query(selectCreatedProjQuery, [username],
                    (err, result) => {
                        if (err) {
                            response.status(500).json("Oops, something went wrong on our side! Please try again.")
                        } else {
                            // get the projects that the user has backed
                            let created = []
                            result.rows.forEach((proj, index) => {
                                let createdProjData = {
                                    creator: proj.username,
                                    orgname: proj.orgname,
                                    teamname: proj.teamname,
                                    projname: proj.projname
                                }
                                created.push(createdProjData)
                            })
                            console.log(data)
                            data.created = created
                            let selectBackedProjQuery = 'SELECT * FROM users JOIN funds ON users.username = funds.backer WHERE users.username = $1'
                            client.query(selectBackedProjQuery, [username],
                                (err, result) => {
                                    if (err) {
                                        response.status(500).json("Oops, something went wrong on our side! Please try again.")
                                    } else {
                                        // get the projects that the user is following
                                        let backed = []
                                        result.rows.forEach((proj, index) => {
                                            let backedProjData = {
                                                creator: proj.creator,
                                                orgname: proj.orgname,
                                                teamname: proj.teamname,
                                                projname: proj.projname,
                                                amount: proj.amount
                                            }
                                            backed.push(backedProjData)
                                        })
                                        data.backed = backed
                                        let selectFollowProjQuery = 'SELECT * FROM users JOIN follows ON users.username = follows.follower WHERE users.username = $1'
                                        client.query(selectFollowProjQuery, [username],
                                            (err, result) => {
                                                if (err) {
                                                    response.status(500).json("Oops, something went wrong on our side! Please try again.")
                                                } else {
                                                    let followed = []
                                                    result.rows.forEach((proj, index) => {
                                                        let followedProjData = {
                                                            creator: proj.creator,
                                                            orgname: proj.orgname,
                                                            teamname: proj.teamname,
                                                            projname: proj.projname,
                                                        }
                                                        followed.push(followedProjData)
                                                    })
                                                    data.followed = followed
                                                    response.status(200).json(data)
                                                }
                                            })
                                    }
                                })
                        }
                    })

            }
        })
    })
}

const followProject = (request, response) => {
    const { follower, creator, orgname, teamname, projname } = request.body;
    console.log(`${follower} will now follow ${projname} created by ${creator}`)

    pool.then(client => {
        const insertFollowQuery = 'INSERT INTO follows (follower, creator, orgname, teamname, projname) VALUES ($1, $2, $3, $4, $5)'
        return client.query(insertFollowQuery, [follower, creator, orgname, teamname, projname],
            (err, result) => {
                if (err) {
                    response.status(500).json(`Insert failed with error: ${err}`)
                } else {
                    response.status(201).json("Insert successful.")
                }
            })
    })
}

const fundProject = (request, response) => {
    const { amount, backer, creator, orgname, teamname, projname } = request.body;
    console.log(request.body);

    console.log(`${backer} is funding project: ${projname}`);

    simplePool.connect((err, client, done) => {
        const shouldAbort = err => {
            if (err) {
                console.error('Error in transaction', err.stack)
                client.query('ROLLBACK', err => {
                    if (err) {
                        console.error('Error rolling back client', err.stack)
                    }
                    done()
                })
            }
            return !!err
        }

        client.query('BEGIN', err => {
            if (shouldAbort(err)) {
                response.status(500).json('Error in transaction')
            } else {
                const updateQuery = 'UPDATE projects SET curfunds = curfunds + $1 WHERE username = $2 AND orgname = $3 AND teamname = $4 AND projname = $5'
                client.query(updateQuery, [amount, creator, orgname, teamname, projname], (err, res) => {
                    if (shouldAbort(err)) {
                        response.status(500).json('Error in transaction - update')
                    } else {
                        const timestamp = moment().unix();
                        const insertFundsQuery = 'INSERT INTO funds VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (backer, creator, orgname, teamname, projname) DO UPDATE SET amount = funds.amount + $6, timestamp = $7'
                        const insertFundsValues = [backer, creator, orgname, teamname, projname, amount, timestamp]
                        client.query(insertFundsQuery, insertFundsValues, (err, res) => {
                            if (shouldAbort(err)) {
                                response.status(500).json('Error in transaction - insert funds')
                            } else {
                                const insertFollowsQuery = 'INSERT INTO follows VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING'
                                const insertFollowsValues = [backer, creator, orgname, teamname, projname]
                                client.query(insertFollowsQuery, insertFollowsValues, (err, res) => {
                                    if (shouldAbort(err)) return

                                    client.query('COMMIT', err => {
                                        if (err) {
                                            console.error('Error committing transaction', err.stack)
                                            response.status(500).json('Error committing transaction')
                                        } else {
                                            response.status(201).json('Funds have been added!')
                                        }
                                        done()
                                    })
                                })
                            }
                        })
                    }
                })
            }
        })
    })
}

const getAllProjects = (request, response) => {
    console.log('Getting all projects');

    pool.then(client => {
        return client.query('SELECT * FROM projects', [],
            (err, result) => {
                if (err) {
                    response.status(404).json('No projects found')
                } else {
                    response.status(200).json(result.rows)
                }
            })
    })

}

const getFeaturedProjects = (request, response) => {
    console.log('Getting featured projects');

    pool.then(client => {
        return client.query('SELECT * FROM projects WHERE status = $1 ORDER BY curfunds DESC LIMIT 3', ['In Progress'],
            (err, result) => {
                if (err) {
                    console.log(err);
                    response.status(500).json(err)
                } else {
                    console.log(result.rows);
                    response.status(200).json(result.rows)
                }
            })
    })
}

const login = (request, res) => {
    const { email, password } = request.body;
    console.log("User submitted: ", email, password);

    pool.then(client => {
        return client.query('SELECT * FROM users WHERE email = $1', [email], (err, result) => {
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
                            config.secret,
                            { expiresIn: 129600 }); // Signing the token

                        console.log(token);

                        res.status(200).json({
                            success: true,
                            err: null,
                            token: token
                        });
                    } else {
                        console.log('invalid creds')
                        res.status(401).json({
                            success: false,
                            token: null,
                            err: 'Invalid Credentials'
                        });
                    }
                })
            }
        })
    })
    // return client.query('SELECT * FROM users WHERE email = $1', [email], (err, result) => {
    //     if (err) {
    //         console.log("Error here", err)
    //     }
    //     if (result.rows.length === 0) {
    //         res.status(403).json({
    //             sucess: false,
    //             token: null,
    //             err: 'Invalid Credentials'
    //         });
    //     } else {
    //         let userObj = result.rows[0]
    //         console.log(result)
    //         bcrypt.compare(password, userObj.password, function (err, result) {
    //             if (err) {
    //                 console.log(err)
    //             }
    //             if (result === true) {
    //                 console.log("Valid credentials!");

    //                 let token = jwt.sign(
    //                     {
    //                         name: userObj.name,
    //                         username: userObj.username
    //                     },
    //                     // 'jwtsecret',
    //                     config.secret,
    //                     { expiresIn: 129600 }); // Signing the token

    //                 console.log(token);

    //                 res.json({
    //                     sucess: true,
    //                     err: null,
    //                     token: token
    //                 });


    //             } else {
    //                 console.log('invalid creds')
    //                 res.status(401).json({
    //                     sucess: false,
    //                     token: null,
    //                     err: 'Invalid Credentials'
    //                 });
    //             }
    //         })
    //     }
    // })
}

const searchProjects = (request, response) => {
    const { searchString } = request.params
    console.log(`Searching for projects that have ${searchString} in title or description`);

    pool.then(client => {
        const selectProjectQuery = 'SELECT * FROM projects WHERE LOWER(projname) LIKE LOWER($1) OR LOWER(description) LIKE LOWER($1)'
        client.query(selectProjectQuery, [`%${searchString}%`],
            (err, result) => {
                if (err) {
                    response.status(500).json('Server Error')
                } else {
                    response.status(200).json(result.rows)
                }
            })
    })

}

const setProjectStatus = (request, response) => {
    const { username, orgname, teamname, projname, status } = request.body;
    console.log(`Setting status of ${projname} to ${status}`);

    pool.then(client => {
        let updateStatusQuery = 'UPDATE projects SET status = $1 WHERE username = $2 AND orgname = $3 AND teamname = $4 AND projname = $5'
        return client.query(updateStatusQuery, [status, username, orgname, teamname, projname],
            (err, result) => {
                if (err) {
                    console.log(err);
                    response.status(404).json('Project not found.')
                } else {
                    response.status(200).json('Project status updated.')
                }
            })
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
        pool.then(client => {
            return client.query('INSERT INTO users (username, name, email, password) VALUES ($1, $2, $3, $4)',
                [username, name, email, hash],
                (error, result) => {
                    if (error) {
                        console.log(error)
                        response.status(500).json(error)
                    } else {
                        console.log(result)
                        response.status(201).json("User added")
                    }
                })
        })
    });
}

const startProject = (request, response) => {
    const { team, title, description, goal, deadline, category, orgName, username } = request.body;
    console.log(request.body);

    // insert into teams table
    pool.then(client => {
        return client.query('INSERT INTO teams (username, teamName, orgName) values ($1, $2, $3) ON CONFLICT DO NOTHING',
            [username, team, orgName], (error, result) => {
                if (error) {
                    console.log(error);
                    response.status(500).json(error)
                } else {
                    let selectTupleStatement = 'SELECT * FROM projects WHERE username = $1 AND teamName = $2 AND orgName = $3 AND projName = $4';
                    client.query(selectTupleStatement, [username, team, orgName, title], (error, result) => {
                        if (error) {
                            console.log(error);
                            response.status(500).json(error);
                        } else if (result.rows.length > 0) {
                            response.status(400).json("You\'ve already created a project with this name")
                        } else {
                            let insertStatement = 'INSERT INTO projects (username,teamname, orgname, projname, description,categories, deadline, goal) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)'
                            client.query(insertStatement, [username, team, orgName, title, description, category, deadline, goal],
                                (error, result) => {
                                    if (error) {
                                        console.log(error);
                                        response.status(500).json("Oops, something went wrong. Please try again!s")
                                    } else {
                                        console.log("Project added");
                                        response.status(201).json("Project added")
                                    }
                                })
                        }
                    })
                }
            })
    })

}

const unfollowProject = (request, response) => {
    const { follower, creator, orgname, teamname, projname } = request.params;
    console.log(`${follower} will now unfollow ${projname} created by ${creator}`)

    pool.then(client => {
        const deleteFollowQuery = 'DELETE FROM follows WHERE follower = $1 AND creator = $2 AND orgname = $3 AND teamname = $4 AND projname = $5'
        return client.query(deleteFollowQuery, [follower, creator, orgname, teamname, projname],
            (err, result) => {
                if (err) {
                    response.status(404).json(`Not Found`)
                } else {
                    response.status(204).json("Delete successful.")
                }
            })
    })
}

const withdraw = (request, response) => {
    const { backer, creator, orgname, teamname, projname } = request.body;
    console.log(`${backer} attempting to withdraw funding from ${projname} created by ${creator}`)

    simplePool.connect((err, client, done) => {
        const shouldAbort = err => {
            if (err) {
                console.error('Error in transaction', err.stack)
                client.query('ROLLBACK', err => {
                    if (err) {
                        console.error('Error rolling back client', err.stack)
                    }
                    done()
                })
            }
            return !!err
        }

        client.query('BEGIN', err => {
            if (shouldAbort(err)) {
                response.status(500).json(`Error in transaction: ${err}`)
            } else {
                const getQuery = 'SELECT amount FROM funds where backer = $1 AND creator = $2 AND orgname = $3 AND teamname = $4 AND projname = $5'
                client.query(getQuery, [backer, creator, orgname, teamname, projname],
                    (err, result) => {
                        if (shouldAbort(err)) {
                            response.status(500).json('Error in transaction - select')
                        } else {
                            console.log(result.rows);
                            const amount = result.rows[0].amount
                            const updateQuery = 'UPDATE projects set curfunds = curfunds - $1 WHERE username = $2 AND orgname = $3 AND teamname = $4 AND projname = $5'
                            let updateQueryValues = [amount, creator, orgname, teamname, projname]
                            client.query(updateQuery, updateQueryValues,
                                (err, res) => {
                                    if (shouldAbort(err)) {
                                        response.status(500).json('Error in transaction - update projects')
                                    } else {
                                        const deleteQuery = 'DELETE FROM funds WHERE backer = $1 AND creator = $2 AND orgname = $3 AND teamname = $4 AND projname = $5'
                                        const deleteQueryValues = [backer, creator, orgname, teamname, projname]
                                        client.query(deleteQuery, deleteQueryValues,
                                            (err, res) => {
                                                if (shouldAbort(err)) {
                                                    response.status(500).json('Error in transaction - delete funds')
                                                } else {
                                                    client.query('COMMIT', err => {
                                                        if (err) {
                                                            console.error('Error committing transaction', err.stack)
                                                            response.status(500).json('Error committing transaction')
                                                        } else {
                                                            response.status(200).json({
                                                                message: 'Funding has been withdrawn',
                                                                amount: amount
                                                            })
                                                        }
                                                        done()
                                                    })
                                                }
                                            })
                                    }
                                })
                        }
                    })
            }
        })
    })
}

module.exports = {
    getUsers,
    signup,
    deleteUser,
    login,
    getUserByEmail,
    getUserByUsername,
    getCategories,
    startProject,
    getProjectDetails,
    testEndpoint,
    fundProject,
    followProject,
    unfollowProject,
    setProjectStatus,
    getFeaturedProjects,
    withdraw,
    getAllProjects,
    comment,
    getComments,
    deleteComment,
    searchProjects,
    deleteProject,
    editProject
}