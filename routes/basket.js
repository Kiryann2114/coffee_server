const md5 = require('md5');
const connsql = require('../database');

// Calculate total price of items in the basket
function countBasket(req, res) {
    let strArr = req.body.basket.split(",");
    let itemMap = new Map();
    let totalCost = 0;

    // Обработка каждого элемента корзины
    strArr.forEach((item) => {
        let [id, quantity] = item.split(":");
        id = parseInt(id);
        quantity = parseInt(quantity);

        // Проверяем, что id и quantity не отрицательные и что quantity не равно 0
        if (id > 0 && quantity > 0) {
            // Получаем цену товара из базы данных
            let query = 'SELECT price * ? AS cost FROM Tovar WHERE id = ?';
            connsql.query(query, [quantity, id], (err, result) => {
                if (err) {
                    console.error('Error during querying Tovar:', err);
                    res.status(500).send('Server error');
                    return;
                }

                // Если найдена цена, добавляем стоимость товара к общей стоимости
                if (result.length > 0) {
                    let cost = parseFloat(result[0].cost);
                    totalCost += cost;

                    // Добавляем количество товара к существующему или создаем новую запись
                    if (itemMap.has(id)) {
                        itemMap.set(id, itemMap.get(id) + quantity);
                    } else {
                        itemMap.set(id, quantity);
                    }

                    // Проверяем обработку всех элементов корзины
                    if (itemMap.size === strArr.length) {
                        // Преобразуем Map обратно в строку корзины
                        let updatedBasket = [...itemMap].map(([id, quantity]) => `${id}:${quantity}`).join(",");
                        res.json({ basket: updatedBasket, count: totalCost });
                    }
                }
            });
        }
    });
}


function updateBasket(req, res) {
    // Проверяем, есть ли такой пользователь в таблице newusers
    console.log("мы в методе updateBasket");
    let queryNewUsers = 'SELECT * FROM newusers WHERE login = ?';
    let itemMap = new Map(); // Используем Map для облегчения поиска и обновления элементов
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
                    let parts = inputItem.split(':');
                    let itemId = parseInt(parts[0]);
                    let itemCount = parseInt(parts[1]);
                    console.log(parts);
                    console.log(itemId);
                    console.log(itemCount);
                    if (itemId >= 1 && itemCount >= 0 && itemCount <= 1000) {
                        if (itemMap.has(itemId)) {
                            itemMap.set(itemId, itemCount);
                        } else {
                            itemMap.set(itemId, itemCount);
                        }
                    }
                });
                console.log("как?");
                console.log(itemMap);
                // Обновляем строку корзины
                let updatedKorzina = [...itemMap].map(([itemId, itemCount]) => `${itemId}:${itemCount}`).join(',');
                console.log(updatedKorzina);

                // Проверяем, есть ли пользователь в таблице usersItems
                let queryUsersItems = 'SELECT * FROM usersItems WHERE login = ?';
                connsql.query(queryUsersItems, [req.body.login.toLowerCase()], (err, resultUsersItems) => {
                    if (err) {
                        console.error('Error during querying usersItems:', err);
                        res.status(500).send('Server error');
                    } else {
                        let updateQuery;
                        let queryParams;
                        if (resultUsersItems.length > 0) {
                            // Если пользователь уже есть в таблице, обновляем корзину
                            updateQuery = 'UPDATE usersItems SET korzina = ? WHERE login = ?';
                            queryParams = [updatedKorzina, req.body.login.toLowerCase()];
                        } else {
                            // Если пользователя нет в таблице, создаем новую запись
                            updateQuery = 'INSERT INTO usersItems (login, korzina) VALUES (?, ?)';
                            queryParams = [req.body.login.toLowerCase(), updatedKorzina];
                        }
                        connsql.query(updateQuery, queryParams, (err, result) => {
                            if (err) {
                                console.error('Error during updating korzina:', err);
                                res.status(500).send('Server error');
                            } else {
                                // Возвращаем обновленное значение корзины
                                res.json({ res: updatedKorzina });
                            }
                        });
                    }
                });
            }
        }
    });
}





// Update the basket of a user
function updateBasket1(req, res) {
    let query = 'SELECT COUNT(*) <> 0 AS res FROM users WHERE mail = ? AND password = ?';
    connsql.query(query, [req.body.mail.toLowerCase(), md5(req.body.pass)], (err, result) => {
        if (err) {
            console.error('Error during updateBasket:', err);
            res.status(500).send('Server error');
            return;
        }

        if (result[0].res) {
            let query1 = 'UPDATE users SET korzina = ? WHERE mail = ? AND password = ?';
            connsql.query(query1, [req.body.value, req.body.mail.toLowerCase(), md5(req.body.pass)], (err) => {
                if (err) {
                    console.error('Error during updateBasket:', err);
                    res.status(500).send('Server error');
                } else {
                    res.json({ status: 'ok' });
                }
            });
        } else {
            res.status(403).send('Unauthorized');
        }
    });
}

// Get the basket of a user
function getBasket(req, res) {
    // Проверяем, есть ли такой пользователь в таблице newusers
    let queryNewUsers = 'SELECT * FROM newusers WHERE login = ?';
    connsql.query(queryNewUsers, [req.body.login.toLowerCase()], (err, resultNewUsers) => {
        if (err) {
            console.error('Error during querying newusers:', err);
            res.status(500).send('Server error');
        } else {
            // Пользователь найден, ищем его корзину в таблице usersItems
            let queryUsersItems = 'SELECT korzina FROM usersItems WHERE login = ?';
            connsql.query(queryUsersItems, [req.body.login.toLowerCase()], (err, resultUsersItems) => {
                if (err) {
                    console.error('Error during querying usersItems:', err);
                    res.status(500).send('Server error');
                } else {
                    console.log("стоп");
                    console.log(resultUsersItems);
                    if (resultUsersItems.length === 0) {
                        // Пользователь не найден в таблице usersItems, создаем новую запись для него с пустой корзиной
                        let insertEmptyBasketQuery = 'INSERT INTO usersItems (login, korzina) VALUES (?, ?)';
                        connsql.query(insertEmptyBasketQuery, [req.body.login.toLowerCase(), ''], (err, result) => {
                            if (err) {
                                console.error('Error during creating empty basket:', err);
                                res.status(500).send('Server error');
                            } else {
                                // Возвращаем пустую корзину
                                res.json({ res: "" });
                            }
                        });
                    } else {
                        // Обработка корзины
                        let korzina = resultUsersItems[0].korzina;
                        let items = korzina.split(',');
                        let updatedItems = [];
                        items.forEach(item => {
                            let parts = item.split(':');
                            let itemId = parseInt(parts[0]);
                            let itemCount = parseInt(parts[1]);
                            if (itemId > 0 && itemCount > 0 && itemCount <= 1000) {
                                updatedItems.push(`${itemId}:${Math.min(itemCount, 1000)}`);
                            }
                        });
                        // Составляем строку снова
                        let updatedKorzina = updatedItems.join(',');
                        // Обновляем корзину в базе данных
                        let updateQuery = 'UPDATE usersItems SET korzina = ? WHERE login = ?';
                        connsql.query(updateQuery, [updatedKorzina, req.body.login.toLowerCase()], (err, result) => {
                            if (err) {
                                console.error('Error during updating korzina:', err);
                                res.status(500).send('Server error');
                            } else {
                                // Возвращаем обновленное значение корзины
                                res.json({ res: updatedKorzina });
                            }
                        });
                    }
                }
            });
        }
    });
}





module.exports = {
    countBasket,
    updateBasket,
    getBasket
};
