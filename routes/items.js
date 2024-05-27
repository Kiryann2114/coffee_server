const md5 = require('md5');
//const connsql = require('../database');
const pool = require('../pool');

// Get all items method
function getTovar(req, res) {
    console.log(req.body);
    const query = 'SELECT * FROM Tovar';

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Ошибка при получении соединения из пула:', err);
            return res.status(500).send('Ошибка сервера');
        }

        connection.query(query, (err, result) => {
            connection.release();
            if (err) {
                console.error('Ошибка при выполнении запроса к базе данных:', err);
                return res.status(500).send('Ошибка сервера');
            }

            console.log("Данные о товарах получены успешно");
            res.json(result);
        });
    });
}


// Delete item method
function deleteItem(req, res) {
    // Параметризованный запрос для проверки аутентификации пользователя
    const authQuery = 'SELECT COUNT(*) AS res FROM users WHERE id = ? AND mail = ? AND password = ?';

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Ошибка при получении соединения из пула:', err);
            return res.status(500).send('Ошибка сервера');
        }

        connection.query(authQuery, [0, req.body.mail.toLowerCase(), md5(req.body.pass)], (err, result) => {
            if (err) {
                console.error('Ошибка при проверке аутентификации пользователя:', err);
                connection.release();
                return res.status(500).send('Ошибка сервера');
            }

            if (result[0].res) {
                // Параметризованный запрос для удаления элемента
                const deleteQuery = 'DELETE FROM Tovar WHERE id = ?';
                connection.query(deleteQuery, [req.body.id], (err) => {
                    connection.release();
                    if (err) {
                        console.error('Ошибка при удалении элемента:', err);
                        return res.status(500).send('Ошибка сервера');
                    }
                    res.json({ status: "ok" });
                });
            } else {
                connection.release();
                res.status(403).send('Unauthorized');
            }
        });
    });
}

// Add item method
function addItem(req, res) {
    // Параметризованный запрос для проверки аутентификации пользователя
    const authQuery = 'SELECT COUNT(*) AS res FROM users WHERE id = ? AND mail = ? AND password = ?';

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Ошибка при получении соединения из пула:', err);
            return res.status(500).send('Ошибка сервера');
        }

        connection.query(authQuery, [0, req.body.mail.toLowerCase(), md5(req.body.pass)], (err, result) => {
            if (err) {
                console.error('Ошибка при проверке аутентификации пользователя:', err);
                connection.release();
                return res.status(500).send('Ошибка сервера');
            }

            if (result[0].res) {
                // Параметризованный запрос для получения следующего доступного ID
                const getNextIdQuery = 'SELECT MAX(id) + 1 AS ID FROM Tovar';
                connection.query(getNextIdQuery, (err, result) => {
                    if (err) {
                        console.error('Ошибка при получении следующего доступного ID:', err);
                        connection.release();
                        return res.status(500).send('Ошибка сервера');
                    }

                    const nextId = result[0].ID || 1; // Если в результате нет ID, используем 1
                    // Параметризованный запрос для добавления элемента
                    const addItemQuery = 'INSERT INTO Tovar (id, name, opisanie, price, optprice) VALUES (?, "", "", 0, 0)';
                    connection.query(addItemQuery, [nextId], (err) => {
                        connection.release();
                        if (err) {
                            console.error('Ошибка при добавлении элемента:', err);
                            return res.status(500).send('Ошибка сервера');
                        }
                        res.json({ status: "ok" });
                    });
                });
            } else {
                connection.release();
                res.status(403).send('Unauthorized');
            }
        });
    });
}

// Update item method
function updateItem(req, res) {
    // Параметризованный запрос для проверки аутентификации пользователя
    const authQuery = 'SELECT COUNT(*) AS res FROM users WHERE id = ? AND mail = ? AND password = ?';

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Ошибка при получении соединения из пула:', err);
            return res.status(500).send('Ошибка сервера');
        }

        connection.query(authQuery, [0, req.body.mail.toLowerCase(), md5(req.body.pass)], (err, result) => {
            if (err) {
                console.error('Ошибка при проверке аутентификации пользователя:', err);
                connection.release();
                return res.status(500).send('Ошибка сервера');
            }

            if (result[0].res) {
                // Параметризованный запрос для обновления элемента
                const updateQuery = 'UPDATE Tovar SET name = ?, opisanie = ?, price = ?, optprice = ? WHERE id = ?';
                connection.query(updateQuery, [req.body.name, req.body.opisanie, req.body.price, req.body.optprice, req.body.id], (err) => {
                    connection.release();
                    if (err) {
                        console.error('Ошибка при обновлении элемента:', err);
                        return res.status(500).send('Ошибка сервера');
                    }
                    res.json({ status: "ok" });
                });
            } else {
                connection.release();
                res.status(403).send('Unauthorized');
            }
        });
    });
}



module.exports = {
    getTovar,
    deleteItem,
    addItem,
    updateItem
};
