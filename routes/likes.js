const md5 = require('md5');
const connsql = require('../database');


function mergeLiked(req, res) {
    // Проверяем, есть ли такой пользователь в таблице newusers
    console.log("мы в методе mergeLikes");
    let queryNewUsers = 'SELECT * FROM newusers WHERE login = ?';
    let itemSet = new Set(); // Используем Set для облегчения поиска и избежания дубликатов
    connsql.query(queryNewUsers, [req.body.login.toLowerCase()], (err, resultNewUsers) => {
        if (err) {
            console.error('Error during querying newusers:', err);
            res.status(500).send('Server error');
        } else {
            if (resultNewUsers.length === 0) {
                // Пользователь не найден, возвращаем 0
                res.json({ res: 0 });
            } else {
                // Обрабатываем входные элементы
                let inputItems = req.body.items.split(',');
                inputItems.forEach(itemId => {
                    // Проверяем, что id больше 1
                    if (parseInt(itemId) >= 1) {
                        // Добавляем id во множество
                        itemSet.add(parseInt(itemId));
                    }
                });

                // Проверяем, есть ли пользователь в таблице usersItems
                let queryUsersItems = 'SELECT * FROM usersItems WHERE login = ?';
                connsql.query(queryUsersItems, [req.body.login.toLowerCase()], (err, resultUsersItems) => {
                    if (err) {
                        console.error('Error during querying usersItems:', err);
                        res.status(500).send('Server error');
                    } else {
                        let existingItemsSet = new Set();
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

                        let updatedLiked = [...itemSet].join(',');
                        let updateQuery;
                        let queryParams;
                        if (resultUsersItems.length > 0) {
                            updateQuery = 'UPDATE usersItems SET liked = ? WHERE login = ?';
                            queryParams = [updatedLiked, req.body.login.toLowerCase()];
                        } else {
                            updateQuery = 'INSERT INTO usersItems (login, liked) VALUES (?, ?)';
                            queryParams = [req.body.login.toLowerCase(), updatedLiked];
                        }

                        connsql.query(updateQuery, queryParams, (err, result) => {
                            if (err) {
                                console.error('Error during updating liked:', err);
                                res.status(500).send('Server error');
                            } else {
                                res.json({ res: updatedLiked });
                            }
                        });
                    }
                });
            }
        }
    });
}

function updateLiked(req, res) {
    // Проверяем, есть ли такой пользователь в таблице newusers
    console.log("мы в методе updateLiked");
    let queryNewUsers = 'SELECT * FROM newusers WHERE login = ?';
    let itemSet = new Set(); // Используем Set для облегчения поиска и обновления элементов
    connsql.query(queryNewUsers, [req.body.login.toLowerCase()], (err, resultNewUsers) => {
        if (err) {
            console.error('Error during querying newusers:', err);
            res.status(500).send('Server error');
        } else {
            if (resultNewUsers.length === 0) {
                // Пользователь не найден, возвращаем 0
                res.json({ res: 0 });
            } else {
                // Обрабатываем входные элементы
                let inputItems = req.body.items.split(',');
                console.log(inputItems);
                inputItems.forEach(inputItem => {
                    let itemId = parseInt(inputItem);
                    if (itemId >= 1) {
                        itemSet.add(itemId);
                    }
                });
                
                // Проверяем, есть ли пользователь в таблице usersItems
                let queryUsersItems = 'SELECT * FROM usersItems WHERE login = ?';
                connsql.query(queryUsersItems, [req.body.login.toLowerCase()], (err, resultUsersItems) => {
                    if (err) {
                        console.error('Error during querying usersItems:', err);
                        res.status(500).send('Server error');
                    } else {
                        let updatedLiked = [...itemSet].join(',');
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
                        
                        connsql.query(updateQuery, queryParams, (err, result) => {
                            if (err) {
                                console.error('Error during updating liked:', err);
                                res.status(500).send('Server error');
                            } else {
                                // Возвращаем обновленное значение liked
                                res.json({ res: updatedLiked });
                            }
                        });
                    }
                });
            }
        }
    });
}




// Get the basket of a user
function getLiked(req, res) {
    // Проверяем, есть ли такой пользователь в таблице newusers
    let queryNewUsers = 'SELECT * FROM newusers WHERE login = ?';
    connsql.query(queryNewUsers, [req.body.login.toLowerCase()], (err, resultNewUsers) => {
        if (err) {
            console.error('Error during querying newusers:', err);
            res.status(500).send('Server error');
        } else {
            // Пользователь найден, ищем его liked в таблице usersItems
            let queryUsersItems = 'SELECT liked FROM usersItems WHERE login = ?';
            connsql.query(queryUsersItems, [req.body.login.toLowerCase()], (err, resultUsersItems) => {
                if (err) {
                    console.error('Error during querying usersItems:', err);
                    res.status(500).send('Server error');
                } else {
                    if (resultUsersItems.length === 0) {
                        // Пользователь не найден в таблице usersItems, создаем новую запись для него с пустым liked
                        let insertEmptyLikedQuery = 'INSERT INTO usersItems (login, liked) VALUES (?, ?)';
                        connsql.query(insertEmptyLikedQuery, [req.body.login.toLowerCase(), ''], (err, result) => {
                            if (err) {
                                console.error('Error during creating empty liked:', err);
                                res.status(500).send('Server error');
                            } else {
                                // Возвращаем пустой liked
                                res.json({ res: "" });
                            }
                        });
                    } else {
                        // Обработка liked
                        let liked = resultUsersItems[0].liked;
                        let items = liked.split(',');
                        let updatedItems = [];
                        items.forEach(item => {
                            let itemId = parseInt(item);
                            if (itemId > 0) {
                                updatedItems.push(`${itemId}`);
                            }
                        });
                        // Составляем строку снова
                        let updatedLiked = updatedItems.join(',');
                        // Обновляем liked в базе данных
                        let updateQuery = 'UPDATE usersItems SET liked = ? WHERE login = ?';
                        connsql.query(updateQuery, [updatedLiked, req.body.login.toLowerCase()], (err, result) => {
                            if (err) {
                                console.error('Error during updating liked:', err);
                                res.status(500).send('Server error');
                            } else {
                                // Возвращаем обновленное значение liked
                                res.json({ res: updatedLiked });
                            }
                        });
                    }
                }
            });
        }
    });
}

module.exports = {
    updateLiked,
    getLiked,
    mergeLiked
};
