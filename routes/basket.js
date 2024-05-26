const connsql = require('../database');

// Calculate total price of items in the basket
function countBasket(req, res) {
    if (!req.body.basket || req.body.basket.trim() === '') {
        return res.json({ basket: 0, count: 0 });
    }
    let strArr = req.body.basket.split(",");
    let itemMap = new Map();
    let totalCost = 0;
    let processedItems = 0;

    // Обработка каждого элемента корзины
    strArr.forEach((item, index) => {
        let [id, quantity] = item.split(":");
        id = parseInt(id);
        let origQuantity = parseInt(quantity);
        
        // Проверка, что id больше 0 и quantity в допустимом диапазоне
        if (id > 0 && origQuantity >= 1) {
            // Округляем quantity до 1000, если оно больше 1000
            let quantity = Math.min(origQuantity, 1000);

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
                }

                processedItems++;

                if (processedItems === strArr.length) {
                    let updatedBasket = [...itemMap].map(([id, quantity]) => `${id}:${quantity}`).join(",");
                    console.log("----------");
                    console.log(updatedBasket);
                    console.log(totalCost);
                    res.json({ basket: updatedBasket, count: totalCost });
                }
            });
        } else {
            console.error('Invalid id or quantity:', id, origQuantity);
            processedItems++;
            if (processedItems === strArr.length) {
                res.status(400).send('Invalid id or quantity');
            }
        }
    });
}


function mergeBasket(req, res) {
    // Проверяем, есть ли такой пользователь в таблице newusers
    console.log("мы в методе mergeBasket");
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
                inputItems.forEach(inputItem => {
                    let parts = inputItem.split(':');
                    let itemId = parseInt(parts[0]);
                    let origItemCount = parseInt(parts[1]);
                    // Округляем количество товара до 1000, если оно больше 1000
                    let itemCount = Math.min(origItemCount, 1000);
                    if (itemId >= 1 && itemCount >= 0) {
                        if (itemMap.has(itemId)) {
                            itemMap.set(itemId, itemCount);
                        } else {
                            itemMap.set(itemId, itemCount);
                        }
                    }
                });

                // Проверяем, есть ли пользователь в таблице usersItems
                let queryUsersItems = 'SELECT * FROM usersItems WHERE login = ?';
                connsql.query(queryUsersItems, [req.body.login.toLowerCase()], (err, resultUsersItems) => {
                    if (err) {
                        console.error('Error during querying usersItems:', err);
                        res.status(500).send('Server error');
                    } else {
                        if (resultUsersItems.length > 0) {
                            // Если пользователь уже есть в таблице, обновляем корзину
                            let existingItems = resultUsersItems[0].korzina.split(',');
                            existingItems.forEach(existingItem => {
                                let parts = existingItem.split(':');
                                let itemId = parseInt(parts[0]);
                                let itemCount = parseInt(parts[1]);
                                if (itemMap.has(itemId)) {
                                    itemMap.set(itemId, itemMap.get(itemId) + itemCount);
                                } else {
                                    itemMap.set(itemId, itemCount);
                                }
                            });
                        }

                        // После объединения, проверяем, есть ли элементы, количество которых больше 1000
                        itemMap.forEach((itemCount, itemId) => {
                            if (itemCount > 1000) {
                                itemMap.set(itemId, 1000); // Устанавливаем количество равное 1000
                            }
                        });

                        let updatedKorzina = [...itemMap].map(([itemId, itemCount]) => `${itemId}:${itemCount}`).join(',');
                        let updateQuery;
                        let queryParams;
                        if (resultUsersItems.length > 0) {
                            updateQuery = 'UPDATE usersItems SET korzina = ? WHERE login = ?';
                            queryParams = [updatedKorzina, req.body.login.toLowerCase()];
                        } else {
                            updateQuery = 'INSERT INTO usersItems (login, korzina) VALUES (?, ?)';
                            queryParams = [req.body.login.toLowerCase(), updatedKorzina];
                        }

                        connsql.query(updateQuery, queryParams, (err, result) => {
                            if (err) {
                                console.error('Error during updating korzina:', err);
                                res.status(500).send('Server error');
                            } else {
                                res.json({ res: updatedKorzina });
                            }
                        });
                    }
                });
            }
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
                    if (itemId >= 1 && itemCount >= 0 && itemCount <= 1000) {
                        if (itemMap.has(itemId)) {
                            itemMap.set(itemId, itemCount);
                        } else {
                            itemMap.set(itemId, itemCount);
                        }
                    }
                });
                // Обновляем строку корзины
                let updatedKorzina = [...itemMap].map(([itemId, itemCount]) => `${itemId}:${itemCount}`).join(',');

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
    getBasket,
    mergeBasket
};
