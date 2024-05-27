const mysql = require('mysql2');

// Создаем пул подключений
const pool = mysql.createPool({
    host: "37.140.192.191",
    user: "u2588670_root",
    password: "66AxnmyTLx3CS1ZR",
    database: "u2588670_GodineCoffee",
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0
});

// Проверяем подключение при создании пула
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Ошибка подкючения к БД: ', err);
        return;
    }
    if (connection) connection.release();
    console.log('Подключение к БД установлено');
});

module.exports = pool;
