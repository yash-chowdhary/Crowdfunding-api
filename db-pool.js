const { Pool } = require('pg');

const pool = new Pool({
    user: 'wywokfmlqazmmc',
    host: 'ec2-46-137-113-157.eu-west-1.compute.amazonaws.com',
    database: 'del0jbnikff315',
    port: 5432,
    password: 'b1f1aae0b657507ddd077d7e65989a0a09d18556fb7a4bf276de5d0013dd9e1a',
    ssl:true
});

const conn = pool.connect();
const simplePool = pool;
// const connTransaction = pool.connect((err,client,done));

module.exports = {pool: conn,
    simplePool: simplePool
};