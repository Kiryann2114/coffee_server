const md5 = require('md5');
const connsql = require('../database');
const { sendMail } = require('../mailer');

// Получить информацию о пользователе
function getInfoUser(req, res) {
    const query = 'SELECT name, mail, tel FROM users WHERE mail = ? AND password = ?';
    connsql.query(query, [req.body.mail.toLowerCase(), md5(req.body.pass)], (err, result) => {
        if (err) {
            console.error('Error during getInfoUser:', err);
            res.status(500).send('Server error');
        } else {
            console.log("I'm here");
            res.json(result[0]);
        }
    });
}

// Обновить информацию о пользователе
function updateInfoUser(req, res) {
    console.log(req.body);
    let query = "";
    if (req.body.pass !== "" && req.body.passp !== "") {
        query = 'UPDATE users SET name = ?, tel = ?, mail = ?, password = ? WHERE mail = ? AND password = ?';
        connsql.query(query, [req.body.name, req.body.tel, req.body.mail.toLowerCase(), md5(req.body.pass), req.body.mail.toLowerCase(), md5(req.body.passp)], (err, result) => {
            if (err) {
                console.error('Error during updateInfoUser:', err);
                res.status(500).send('Server error');
                console.log("I'm here err1");
            } else {
                console.log("I'm here1");
                res.json({ status: 'ok' });
            }
        });
    } else {
        query = 'UPDATE users SET name = ?, tel = ? WHERE mail = ? AND password = ?';
        connsql.query(query, [req.body.name, req.body.tel, req.body.mail.toLowerCase(), md5(req.body.passp)], (err, result) => {
            if (err) {
                console.error('Error during updateInfoUser:', err);
                res.status(500).send('Server error');
                console.log("I'm here err2");
            } else {
                console.log("I'm here2");
                res.json({ status: 'ok' });
            }
        });
    }
}

// Отправить письмо для сброса пароля
function sendMailReset(req, res) {
    console.log("send email " + req.body.mail.toLowerCase());
    const query = 'SELECT password FROM users WHERE mail = ?';
    connsql.query(query, [req.body.mail.toLowerCase()], (err, result) => {
        if (err) {
            console.error('Error during sendMailReset:', err);
            res.status(500).send('Server error');
        } else if (result[0]) {
            const url = `${req.body.mail.toLowerCase()}=${result[0].password}`;
            const insertQuery = "INSERT INTO reset (url) VALUES (?)";
            connsql.query(insertQuery, [url], async (err) => {
                if (err) {
                    console.error('Error during sendMailReset:', err);
                    res.status(500).send('Server error');
                } else {
                    const textHtml = `<a href=https://godinecoffee.ru/resetURL?${url}>Перейдите по ссылке для восстановления пароля</a>`;
                    await sendMail(req.body.mail.toLowerCase(), 'Восстановление пароля', 'Это сообщение отправлено для восстановления пароля.', textHtml);
                    res.json({ status: "ok" });
                }
            });
        } else {
            res.status(404).send('User not found');
        }
    });
}

// Сброс пароля пользователя
function resetPass(req, res) {
    if (req.body.url !== "0" && req.body.url !== "") {
        const query = 'SELECT count(*) <> 0 AS res FROM reset WHERE url = ?';
        connsql.query(query, [req.body.url], (err, result) => {
            if (err) {
                console.error('Error during resetPass:', err);
                res.status(500).send('Server error');
            } else if (result[0].res !== 0) {
                const updateQuery = 'UPDATE users SET password = ? WHERE mail = ?';
                const mail = req.body.url.split("=")[0];
                connsql.query(updateQuery, [md5(req.body.pass), mail], (err) => {
                    if (err) {
                        console.error('Error during resetPass:', err);
                        res.status(500).send('Server error');
                    } else {
                        const deleteQuery = 'DELETE FROM reset WHERE url LIKE ?';
                        connsql.query(deleteQuery, [`${req.body.url}%`], (err) => {
                            if (err) {
                                console.error('Error during resetPass:', err);
                                res.status(500).send('Server error');
                            } else {
                                res.json({ status: "ok" });
                            }
                        });
                    }
                });
            } else {
                res.status(404).send('Reset URL not found');
            }
        });
    } else {
        res.status(400).send('Invalid reset URL');
    }
}

module.exports = {
    getInfoUser,
    updateInfoUser,
    sendMailReset,
    resetPass
};
