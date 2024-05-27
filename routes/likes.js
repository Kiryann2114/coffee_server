const pool = require('../pool');
//const connsql = require('../database');


function mergeLiked(req, res) {
    console.log("мы в методе mergeLikes");
    const queryNewUsers = 'SELECT * FROM newusers WHERE login = ?';
    const itemSet = new Set(); // Используем Set для облегчения поиска и избежания дубликатов

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Ошибка при получении соединения из пула:', err);
            return res.status(500).send('Ошибка сервера');
        }

        connection.query(queryNewUsers, [req.body.login.toLowerCase()], (err, resultNewUsers) => {
            if (err) {
                console.error('Ошибка при запросе newusers:', err);
                connection.release();
                return res.status(500).send('Ошибка сервера');
            }

            if (resultNewUsers.length === 0) {
                // Пользователь не найден, возвращаем 0
                connection.release();
                return res.json({ res: 0 });
            }

            // Обрабатываем входные элементы
            const inputItems = req.body.items.split(',');
            inputItems.forEach(itemId => {
                // Проверяем, что id больше 1
                if (parseInt(itemId) >= 1) {
                    // Добавляем id во множество
                    itemSet.add(parseInt(itemId));
                }
            });

            const queryUsersItems = 'SELECT * FROM usersItems WHERE login = ?';

            connection.query(queryUsersItems, [req.body.login.toLowerCase()], (err, resultUsersItems) => {
                if (err) {
                    console.error('Ошибка при запросе usersItems:', err);
                    connection.release();
                    return res.status(500).send('Ошибка сервера');
                }

                const existingItemsSet = new Set();
                if (resultUsersItems.length > 0) {
                    let existingItems = [];
                    if (resultUsersItems[0].liked !== null) {
                        existingItems = resultUsersItems[0].liked.split(',');
                    }
                    existingItems.forEach(existingItemId => {
                        existingItemsSet.add(parseInt(existingItemId));
                    });
                }

                // Объединяем входные элементы и элементы из БД
                existingItemsSet.forEach(itemId => {
                    itemSet.add(itemId);
                });

                const updatedLiked = [...itemSet].join(',');
                let updateQuery;
                let queryParams;

                if (resultUsersItems.length > 0) {
                    updateQuery = 'UPDATE usersItems SET liked = ? WHERE login = ?';
                    queryParams = [updatedLiked, req.body.login.toLowerCase()];
                } else {
                    updateQuery = 'INSERT INTO usersItems (login, liked) VALUES (?, ?)';
                    queryParams = [req.body.login.toLowerCase(), updatedLiked];
                }

                connection.query(updateQuery, queryParams, (err, result) => {
                    connection.release();
                    if (err) {
                        console.error('Ошибка при обновлении liked:', err);
                        return res.status(500).send('Ошибка сервера');
                    } else {
                        res.json({ res: updatedLiked });
                    }
                });
            });
        });
    });
}

function updateLiked(req, res) {
    console.log("мы в методе updateLiked");
    const queryNewUsers = 'SELECT * FROM newusers WHERE login = ?';
    const itemSet = new Set(); // Используем Set для облегчения поиска и обновления элементов

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Ошибка при получении соединения из пула:', err);
            return res.status(500).send('Ошибка сервера');
        }

        connection.query(queryNewUsers, [req.body.login.toLowerCase()], (err, resultNewUsers) => {
            if (err) {
                console.error('Ошибка при запросе newusers:', err);
                connection.release();
                return res.status(500).send('Ошибка сервера');
            }

            if (resultNewUsers.length === 0) {
                // Пользователь не найден, возвращаем 0
                connection.release();
                return res.json({ res: 0 });
            }

            // Обрабатываем входные элементы
            const inputItems = req.body.items.split(',');
            console.log(inputItems);
            inputItems.forEach(inputItem => {
                const itemId = parseInt(inputItem);
                if (itemId >= 1) {
                    itemSet.add(itemId);
                }
            });

            const queryUsersItems = 'SELECT * FROM usersItems WHERE login = ?';

            connection.query(queryUsersItems, [req.body.login.toLowerCase()], (err, resultUsersItems) => {
                if (err) {
                    console.error('Ошибка при запросе usersItems:', err);
                    connection.release();
                    return res.status(500).send('Ошибка сервера');
                }

                const updatedLiked = [...itemSet].join(',');
                let updateQuery;
                let queryParams;

                if (resultUsersItems.length > 0) {
                    // Если пользователь уже есть в таблице, обновляем liked
                    updateQuery = 'UPDATE usersItems SET liked = ? WHERE login = ?';
                    queryParams = [updatedLiked, req.body.login.toLowerCase()];
                } else {
                    // Если пользователя нет в таблице, создаем новую запись
                    updateQuery = 'INSERT INTO usersItems (login, liked) VALUES (?, ?)';
                    queryParams = [req.body.login.toLowerCase(), updatedLiked];
                }

                connection.query(updateQuery, queryParams, (err, result) => {
                    connection.release();
                    if (err) {
                        console.error('Ошибка при обновлении liked:', err);
                        return res.status(500).send('Ошибка сервера');
                    } else {
                        // Возвращаем обновленное значение liked
                        res.json({ res: updatedLiked });
                    }
                });
            });
        });
    });
}


// Get the basket of a user
function getLiked(req, res) {
    console.log("мы в методе getLiked");
    const queryNewUsers = 'SELECT * FROM newusers WHERE login = ?';

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Ошибка при получении соединения из пула:', err);
            return res.status(500).send('Ошибка сервера');
        }

        connection.query(queryNewUsers, [req.body.login.toLowerCase()], (err, resultNewUsers) => {
            if (err) {
                console.error('Ошибка при запросе newusers:', err);
                connection.release();
                return res.status(500).send('Ошибка сервера');
            }

            if (resultNewUsers.length === 0) {
                connection.release();
                return res.status(404).send('Пользователь не найден');
            }

            const queryUsersItems = 'SELECT liked FROM usersItems WHERE login = ?';
            connection.query(queryUsersItems, [req.body.login.toLowerCase()], (err, resultUsersItems) => {
                if (err) {
                    console.error('Ошибка при запросе usersItems:', err);
                    connection.release();
                    return res.status(500).send('Ошибка сервера');
                }

                if (resultUsersItems.length === 0) {
                    const insertEmptyLikedQuery = 'INSERT INTO usersItems (login, liked) VALUES (?, ?)';
                    connection.query(insertEmptyLikedQuery, [req.body.login.toLowerCase(), ''], (err, result) => {
                        connection.release();
                        if (err) {
                            console.error('Ошибка при создании пустого liked:', err);
                            return res.status(500).send('Ошибка сервера');
                        } else {
                            return res.json({ res: "" });
                        }
                    });
                } else {
                    let liked = resultUsersItems[0].liked;
                    let items = liked.split(',');
                    let updatedItems = [];
                    items.forEach(item => {
                        let itemId = parseInt(item);
                        if (itemId > 0) {
                            updatedItems.push(`${itemId}`);
                        }
                    });

                    let updatedLiked = updatedItems.join(',');
                    const updateQuery = 'UPDATE usersItems SET liked = ? WHERE login = ?';
                    connection.query(updateQuery, [updatedLiked, req.body.login.toLowerCase()], (err, result) => {
                        connection.release();
                        if (err) {
                            console.error('Ошибка при обновлении liked:', err);
                            return res.status(500).send('Ошибка сервера');
                        } else {
                            return res.json({ res: updatedLiked });
                        }
                    });
                }
            });
        });
    });
}


module.exports = {
    updateLiked,
    getLiked,
    mergeLiked
};
