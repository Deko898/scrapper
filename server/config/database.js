const mysql = require('mysql');
const util = require('util');

// create connection to database
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'My5qlPa$$',
    database: 'setec_test',
    multipleStatements: true
});

// connect to database
db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to database');
});

db.query = util.promisify(db.query);


module.exports = db;