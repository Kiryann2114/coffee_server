const md5 = require('md5');
//const connsql = require('../database');
const pool = require('../pool');
const { sendMail } = require('../mailer');
const { validateSmen } = require('../validationsmen');

// Получить информацию о пользователе
function getInfoUser(req, res) {
    const query = 'SELECT name, mail, tel FROM users WHERE mail = ? AND password = ?';
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error during getConnection:', err);
            res.status(500).send('Server error');
            return;
        }
        connection.query(query, [req.body.mail.toLowerCase(), md5(req.body.pass)], (err, result) => {
            connection.release();
            if (err) {
                console.error('Error during getInfoUser:', err);
                res.status(500).send('Server error');
            } else {
                console.log("I'm here");
                res.json(result[0]);
            }
        });
    });
}
// Обновить информацию о пользователе
function updateInfoUser(req, res) {
    const { firstname, lastname, email, gender, phone, refreshToken } = req.body;
    const validationResult = validateSmen(req.body);
  
    console.log(req.body);
  
    if (!validationResult.success) {
      return res.status(402).json({ error: validationResult.errors });
    }
  
    if (!refreshToken) {
      return res.status(400).json({ error: ['Потеря refreshToken'] });
    }
  
    // Запрос для получения логина пользователя по refreshToken
    let queryGetLogin = 'SELECT user FROM UserToken WHERE refreshToken = ?';
  
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Ошибка при получении соединения из пула:', err);
        return res.status(500).send('Ошибка сервера');
      }
  
      connection.query(queryGetLogin, [refreshToken], (err, result) => {
        connection.release();
  
        if (err) {
          console.error('Ошибка при запросе UserToken:', err);
          return res.status(500).send('Ошибка сервера');
        }
  
        if (result.length === 0) {
          console.log(result);
          console.log(refreshToken);
          return res.status(404).send('Пользователь не найден');
        }
        console.log(result);
        const login = result[0].user;
        // Запрос для получения информации о пользователе по логину
        let queryGetUser = 'SELECT * FROM newusers WHERE login = ?';
  
        pool.getConnection((err, connection) => {
          if (err) {
            console.error('Ошибка при получении соединения из пула:', err);
            return res.status(500).send('Ошибка сервера');
          }
  
          connection.query(queryGetUser, [login], (err, result) => {
            connection.release();
  
            if (err) {
              console.error('Ошибка при запросе newusers:', err);
              return res.status(500).send('Ошибка сервера');
            }
  
            if (result.length === 0) {
              console.log(result);
              console.log(login);
              return res.status(404).send('Пользователь не найден');
            }
  
            const user = result[0];
            let updates = [];
            let values = [];
  
            if (firstname && firstname !== user.firstname) {
              updates.push('firstname = ?');
              values.push(firstname);
            }
            if (lastname && lastname !== user.lastname) {
              updates.push('lastname = ?');
              values.push(lastname);
            }
            if (email && email.toLowerCase() !== user.email) {
              updates.push('email = ?');
              values.push(email.toLowerCase());
            }
            if (gender && gender !== user.gender) {
              updates.push('gender = ?');
              values.push(gender);
            }
            if (phone && phone !== user.phone) {
              updates.push('phone = ?');
              values.push(phone);
            }
  
            // Если нет изменений, возвращаем статус OK
            if (updates.length === 0) {
              return res.json({ status: 'Успешная смена данных' });
            }
  
            values.push(login);
  
            let updateQuery = `UPDATE newusers SET ${updates.join(', ')} WHERE login = ?`;
  
            pool.getConnection((err, connection) => {
              if (err) {
                console.error('Ошибка при получении соединения из пула:', err);
                return res.status(500).send('Ошибка сервера');
              }
  
              connection.query(updateQuery, values, (err, result) => {
                connection.release();
  
                if (err) {
                  console.error('Ошибка при запросе user info:', err);
                  return res.status(500).send('Ошибка сервера');
                }
  
                res.json({ status: 'ok' });
              });
            });
          });
        });
      });
    });
  }

// Отправить письмо для сброса пароля
function sendMailReset(req, res) {
    console.log("send email " + req.body.mail.toLowerCase());
    const query = 'SELECT password FROM users WHERE mail = ?';
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Ошибка при получении соединения из пула:', err);
            return res.status(500).send('Ошибка сервера');
        }
        connection.query(query, [req.body.mail.toLowerCase()], (err, result) => {
            connection.release(); // Освобождаем соединение после выполнения запроса
            if (err) {
                console.error('Ошибка при запросе пароля пользователя:', err);
                return res.status(500).send('Ошибка сервера');
            }
            if (result[0]) {
                const url = `${req.body.mail.toLowerCase()}=${result[0].password}`;
                const insertQuery = "INSERT INTO reset (url) VALUES (?)";
                pool.getConnection((err, connection) => {
                    if (err) {
                        console.error('Ошибка при получении соединения из пула:', err);
                        return res.status(500).send('Ошибка сервера');
                    }
                    connection.query(insertQuery, [url], async (err) => {
                        connection.release(); // Освобождаем соединение после выполнения запроса
                        if (err) {
                            console.error('Ошибка при добавлении URL для сброса пароля:', err);
                            return res.status(500).send('Ошибка сервера');
                        }
                        const textHtml = `<a href=https://godinecoffee.ru/resetURL?${url}>Перейдите по ссылке для восстановления пароля</a>`;
                        try {
                            await sendMail(req.body.mail.toLowerCase(), 'Восстановление пароля', 'Это сообщение отправлено для восстановления пароля.', textHtml);
                            res.json({ status: "ok" });
                        } catch (error) {
                            console.error('Ошибка при отправке письма:', error);
                            res.status(500).send('Ошибка сервера');
                        }
                    });
                });
            } else {
                res.status(404).send('Пользователь не найден');
            }
        });
    });
}


// Сброс пароля пользователя
function resetPass(req, res) {
    if (req.body.url !== "0" && req.body.url !== "") {
        const query = 'SELECT count(*) <> 0 AS res FROM reset WHERE url = ?';
        pool.getConnection((err, connection) => {
            if (err) {
                console.error('Ошибка при получении соединения из пула:', err);
                return res.status(500).send('Ошибка сервера');
            }
            connection.query(query, [req.body.url], (err, result) => {
                connection.release(); // Освобождаем соединение после выполнения запроса
                if (err) {
                    console.error('Ошибка при запросе URL для сброса пароля:', err);
                    return res.status(500).send('Ошибка сервера');
                }
                if (result[0].res !== 0) {
                    const updateQuery = 'UPDATE users SET password = ? WHERE mail = ?';
                    const mail = req.body.url.split("=")[0];
                    pool.getConnection((err, connection) => {
                        if (err) {
                            console.error('Ошибка при получении соединения из пула:', err);
                            return res.status(500).send('Ошибка сервера');
                        }
                        connection.query(updateQuery, [md5(req.body.pass), mail], (err) => {
                            connection.release(); // Освобождаем соединение после выполнения запроса
                            if (err) {
                                console.error('Ошибка при обновлении пароля:', err);
                                return res.status(500).send('Ошибка сервера');
                            }
                            const deleteQuery = 'DELETE FROM reset WHERE url LIKE ?';
                            pool.getConnection((err, connection) => {
                                if (err) {
                                    console.error('Ошибка при получении соединения из пула:', err);
                                    return res.status(500).send('Ошибка сервера');
                                }
                                connection.query(deleteQuery, [`${req.body.url}%`], (err) => {
                                    connection.release(); // Освобождаем соединение после выполнения запроса
                                    if (err) {
                                        console.error('Ошибка при удалении URL для сброса пароля:', err);
                                        return res.status(500).send('Ошибка сервера');
                                    }
                                    res.json({ status: "ok" });
                                });
                            });
                        });
                    });
                } else {
                    res.status(404).send('URL для сброса пароля не найден');
                }
            });
        });
    } else {
        res.status(400).send('Недопустимый URL для сброса пароля');
    }
}


module.exports = {
    getInfoUser,
    updateInfoUser,
    sendMailReset,
    resetPass
};
