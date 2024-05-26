const md5 = require('md5');
const connsql = require('../database');

// Get all items method
function getTovar(req, res) {
    console.log(req.body)
    let query = 'SELECT * FROM Tovar';
    connsql.query(query, (err, result) => {
        if (err) {
            console.log("tovar err")
            console.error('Error during getTovar:', err);
            res.status(500).send('Server error');
        } else {
            console.log("tovar ok")
            res.json(result);
        }
    });
}

// Delete item method
function deleteItem(req, res) {
    // Параметризованный запрос для проверки аутентификации пользователя
    let authQuery = 'SELECT COUNT(*) AS res FROM users WHERE id = ? AND mail = ? AND password = ?';
    connsql.query(authQuery, [0, req.body.mail.toLowerCase(), md5(req.body.pass)], (err, result) => {
        if (err) {
            console.error('Error during deleteItem:', err);
            return res.status(500).send('Server error');
        }

        if (result[0].res) {
            // Параметризованный запрос для удаления элемента
            let deleteQuery = 'DELETE FROM Tovar WHERE id = ?';
            connsql.query(deleteQuery, [req.body.id], (err) => {
                if (err) {
                    console.error('Error during deleteItem:', err);
                    return res.status(500).send('Server error');
                }
                res.json({ status: "ok" });
            });
        } else {
            res.status(403).send('Unauthorized');
        }
    });
}


// Add item method
function addItem(req, res) {
    // Параметризованный запрос для проверки аутентификации пользователя
    let authQuery = 'SELECT count(*) AS res FROM users WHERE id = ? AND mail = ? AND password = ?';
    connsql.query(authQuery, [0, req.body.mail.toLowerCase(), md5(req.body.pass)], (err, result) => {
        if (err) {
            console.error('Error during addItem:', err);
            return res.status(500).send('Server error');
        }
        
        if (result[0].res) {
            // Параметризованный запрос для получения следующего доступного ID
            let getNextIdQuery = 'SELECT MAX(id)+1 as ID FROM Tovar';
            connsql.query(getNextIdQuery, (err, result) => {
                if (err) {
                    console.error('Error during addItem:', err);
                    return res.status(500).send('Server error');
                }
                
                let nextId = result[0].ID || 1; // Если в результате нет ID, используем 1
                // Параметризованный запрос для добавления элемента
                let addItemQuery = 'INSERT INTO Tovar (id, name, opisanie, price, optprice) VALUES (?, "", "", 0, 0)';
                connsql.query(addItemQuery, [nextId], (err) => {
                    if (err) {
                        console.error('Error during addItem:', err);
                        return res.status(500).send('Server error');
                    }
                    res.json({ status: "ok" });
                });
            });
        } else {
            res.status(403).send('Unauthorized');
        }
    });
}


// Update item method
function updateItem(req, res) {
    // Параметризованный запрос для проверки аутентификации пользователя
    let authQuery = 'SELECT count(*) AS res FROM users WHERE id = ? AND mail = ? AND password = ?';
    connsql.query(authQuery, [0, req.body.mail.toLowerCase(), md5(req.body.pass)], (err, result) => {
        if (err) {
            console.error('Error during updateItem:', err);
            return res.status(500).send('Server error');
        }
        
        if (result[0].res) {
            // Параметризованный запрос для обновления элемента
            let updateQuery = 'UPDATE Tovar SET name = ?, opisanie = ?, price = ?, optprice = ? WHERE id = ?';
            connsql.query(updateQuery, [req.body.name, req.body.opisanie, req.body.price, req.body.optprice, req.body.id], (err) => {
                if (err) {
                    console.error('Error during updateItem:', err);
                    return res.status(500).send('Server error');
                }
                res.json({ status: "ok" });
            });
        } else {
            res.status(403).send('Unauthorized');
        }
    });
}


module.exports = {
    getTovar,
    deleteItem,
    addItem,
    updateItem
};
