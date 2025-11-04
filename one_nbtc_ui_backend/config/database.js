const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3307,
  user: process.env.DB_USER || 'root', 
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'one_nbtc_ui_db'
};

const getConnection = async () => {
  return await mysql.createConnection(dbConfig);
};

module.exports = { getConnection };