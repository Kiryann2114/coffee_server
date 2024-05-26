const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: "37.140.192.191",
    user: "u2588670_root",
    password: "66AxnmyTLx3CS1ZR",
    database: "u2588670_GodineCoffee"
});

connection.connect((err) => {
  if (err) {
    console.error('Ошибка подкючения к БД: ', err);
    return;
  }
  console.log('Подлкючение к БД');
});

module.exports = connection;