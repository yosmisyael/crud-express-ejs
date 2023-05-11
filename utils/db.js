const mysql = require("mysql");
require("dotenv").config();
const db = mysql.createConnection({
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  host: process.env.DB_URI,
  port: process.env.DB_PORT,
});

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log("db connected");
});

module.exports = db;
