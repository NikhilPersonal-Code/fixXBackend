const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();

const dbName = process.env.DB_NAME;
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
};

const pool = mysql.createPool({ ...dbConfig, database: dbName });

module.exports = pool.promise();
