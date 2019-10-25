const Pool = require('pg').Pool
const pool = new Pool({
    user: 'yash',
    host: 'localhost',
    database: 'crowdfunding',
    port: 5432,
    password: 'password',
})

const getUsers = (request, response) => {
    pool.query('SELECT * FROM users ORDER BY name ASC', (error, results) => {
        if (error) {
            response.status(500).send(error)
        } else {
            response.status(200).json(results.rows)
        }
    })
}

const createUser = (request, response) => {
    const { name, email, password } = request.body

    pool.query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3)', [name, email, password], (error, result) => {
        if (error) {
            response.status(500).send(error)
        } else {
            console.log(result)
            response.status(201).send(`User added`)
        }
    })
}

const deleteUser = (request, response) => {
    const email = (request.params.email)
    console.log(email);
    pool.query('DELETE FROM users WHERE email = $1', [email], (error, results) => {
        if (error) {
            throw error
        }
        console.log(results);
        response.status(200).send(`User deleted with email: ${email}`)
    })
}

module.exports = {
    getUsers,
    createUser,
    deleteUser
}