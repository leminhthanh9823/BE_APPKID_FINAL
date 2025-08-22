// sequelize.config.js
require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'dev',
    password: process.env.DB_PASS || 'Tuancayda@123',
    database: process.env.DB_NAME || 'appkid_db2',
    host: process.env.DB_HOST || 'engkid.io.vn',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql'
  }
};
