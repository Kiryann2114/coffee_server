/* global ACCESS_TOKEN_EXPIRATION */
/* global REFRESH_TOKEN_EXPIRATION */
/* global ACCESS_TOKEN_SECRET */
/* global REFRESH_TOKEN_SECRET */
const md5 = require('md5');
const jwt = require('jsonwebtoken');
const { validateRegistration, hashPassword, comparePasswords } = require('../validation');
const crypto = require('crypto');
const connsql = require('../database');
const moment = require('moment');

// Admin login method
function loginAdmin(req, res) {
  let query = 'SELECT count(*) <> 0 AS res FROM users WHERE id = 0 AND mail = ? AND password = ?';
  connsql.query(query, [req.body.mail.toLowerCase(), md5(req.body.pass)], (err, result) => {
      if (err) {
          console.error('Error during loginAdmin:', err);
          res.status(500).send('Server error');
      } else {
          res.json(result[0]);
      }
  });
}

const registerUser = async (req, res) => {
  const validationResult = validateRegistration(req.body);
  console.log(req.body);
  if (!validationResult.success) {
      return res.status(402).json({ error: validationResult.errors });
  }

  const { firstName, lastName, email, username, password, confirmPassword, gender, phone } = req.body;

  // Проверяем, занята ли указанная почта
  const checkEmailQuery = 'SELECT * FROM newusers WHERE email = ?';
  connsql.query(checkEmailQuery, [email], async (checkEmailErr, checkEmailResult) => {
      if (checkEmailErr) {
          console.error('Ошибка при проверке почты: ', checkEmailErr);
          return res.status(500).json({ error: 'Ошибка сервера' });
      }

      if (checkEmailResult.length > 0) {
          return res.status(400).json({ error: 'Эта почта уже используется' });
      }

      // Проверяем, занят ли указанный логин
      const checkUsernameQuery = 'SELECT * FROM newusers WHERE login = ?';
      connsql.query(checkUsernameQuery, [username], async (checkUsernameErr, checkUsernameResult) => {
          if (checkUsernameErr) {
              console.error('Ошибка при проверке логина: ', checkUsernameErr);
              return res.status(500).json({ error: 'Ошибка сервера' });
          }

          if (checkUsernameResult.length > 0) {
              return res.status(400).json({ error: 'Этот логин уже используется' });
          }

          // Хэшируем пароль
          const hashedPassword = await hashPassword(password);

          // Вставляем данные пользователя в базу данных
          const insertQuery = 'INSERT INTO newusers (firstName, lastName, email, login, password, gender, phone) VALUES (?, ?, ?, ?, ?, ?, ?)';
          connsql.query(insertQuery, [firstName, lastName, email, username, hashedPassword, gender, phone], (insertErr, result) => {
              if (insertErr) {
                  console.error('Ошибка при добавлении пользователя: ', insertErr);
                  return res.status(500).json({ error: 'Ошибка сервера' });
              }
              res.status(200).json({ message: 'Пользователь успешно зарегистрирован', username: username, jwtToken: null });
          });
      });
  });
};


// Генерация случайной строки в формате hex
const generateRandomSecret = () => {
    return crypto.randomBytes(32).toString('hex');
  };
  
  const generateAccessToken = (user) => {
    console.log("Я тут1");
    return jwt.sign({ 
      username: user.username, 
      guestMode: user.guestMode, 
      currentTheme: user.currentTheme, 
      error: user.error 
    }, global.ACCESS_TOKEN_SECRET, { expiresIn: global.ACCESS_TOKEN_EXPIRATION });
  };
  
  const generateRefreshToken = (user) => {
    console.log("Я тут2");
    console.log(global.REFRESH_TOKEN_SECRET);
    return jwt.sign({ 
      username: user.username, 
      guestMode: user.guestMode,
      currentTheme: user.currentTheme, 
      error: user.error 
    }, global.REFRESH_TOKEN_SECRET, { expiresIn: global.REFRESH_TOKEN_EXPIRATION });
  };
  
  const updateTokensWithTheme = (req, res) => {
    const { loginUsername, newAccessTokenDate, newRefreshTokenDate } = req.body;
  
    const newaccessToken = generateAccessToken(newAccessTokenDate);
    console.log("Новый access: " + newaccessToken);
    const newrefreshToken = generateRefreshToken(newRefreshTokenDate);
    console.log("Новый refresh: " + newrefreshToken);
  
    const updateTokenQuery = 'UPDATE UserToken SET refreshToken = ?, createdAt = NOW(), expiresIn = NOW() + INTERVAL ? SECOND WHERE user = ?';
    connsql.query(updateTokenQuery, [newrefreshToken, global.REFRESH_TOKEN_EXPIRATION, loginUsername], (updateErr, updateResult) => {
      if (updateErr) {
        console.error('Ошибка при обновлении refresh token в базе данных: ', updateErr);
        console.log('Ты лох оно ниже не спустилось');
        return res.status(500).json({ error: 'Ошибка сервера' });
      }
      console.log('Ты не лох оно ниже спустилось');
      return res.status(200).json({ 
        message: 'Токены успешно обновлены', 
        accessToken: newaccessToken, 
        refreshToken: newrefreshToken, 
        username: loginUsername, 
        jwtToken: newaccessToken 
      });
    });
  };
  
  
  const loginUser = async (req, res) => {
    const { loginOrEmail, pass } = req.body;
    console.log(loginOrEmail);
    console.log(pass);
    console.log(req.body);

    // Генерация ACCESS_TOKEN_SECRET и REFRESH_TOKEN_SECRET
    global.ACCESS_TOKEN_SECRET = generateRandomSecret();
    global.REFRESH_TOKEN_SECRET = generateRandomSecret();

    // Установка секретных ключей в переменные среды
    global.REFRESH_TOKEN_EXPIRATION = 3600;
    global.ACCESS_TOKEN_EXPIRATION = 180;

    // Проверка является ли ввод email или логином
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginOrEmail);
    const checkQuery = isEmail 
        ? 'SELECT * FROM newusers WHERE email = ?' 
        : 'SELECT * FROM newusers WHERE login = ?';

    connsql.query(checkQuery, [loginOrEmail], async (checkErr, checkResult) => {
        if (checkErr) {
            console.error('Ошибка при проверке пользователя: ', checkErr);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }

        if (checkResult.length === 0) {
            return res.status(401).json({ error: 'Пользователь с таким логином или email не найден' });
        }
        
        const user = checkResult[0];
        console.log(user);
        console.log(checkResult);
        const isPasswordValid = await comparePasswords(pass, user.password);
        if (!isPasswordValid) {
            return res.status(402).json({ error: 'Неверный пароль' });
        }

        const refreshTokenQuery = 'SELECT refreshToken FROM UserToken WHERE user = ? AND expiresIn > NOW()';
        const userIdentifier = user.login;
        console.log("Пользователь " + userIdentifier);
        connsql.query(refreshTokenQuery, [userIdentifier], (tokenErr, tokenResult) => {
            if (tokenErr) {
                console.error('Ошибка при проверке refresh token: ', tokenErr);
                return res.status(500).json({ error: 'Ошибка сервера' });
            }

            if (tokenResult.length > 0) {
                const refreshToken = tokenResult[0].refreshToken;
                const accessToken = generateAccessToken({ 
                    username: user.login, 
                    guestMode: false, 
                    error: null 
                });
                return res.status(200).json({ 
                    message: 'Вход в систему', 
                    accessToken: accessToken, 
                    refreshToken: refreshToken, 
                    username: user.login 
                });
            } else {
                const accessToken = generateAccessToken({ 
                    username: user.login, 
                    guestMode: false, 
                    error: null 
                });
                const refreshToken = generateRefreshToken({ 
                    username: user.login, 
                    guestMode: false, 
                    error: null 
                });

                const insertTokenQuery = 'INSERT INTO UserToken (user, refreshToken, expiresIn) VALUES (?, ?, NOW() + INTERVAL ? SECOND)';
                connsql.query(insertTokenQuery, [userIdentifier, refreshToken, global.REFRESH_TOKEN_EXPIRATION], (insertErr, insertResult) => {
                    if (insertErr) {
                        console.error('Ошибка при сохранении refresh token в базе данных: ', insertErr);
                        return res.status(500).json({ error: 'Ошибка сервера' });
                    }
                    res.status(200).json({ 
                        message: 'Вход в систему', 
                        accessToken: accessToken, 
                        refreshToken: refreshToken, 
                        username: user.login 
                    });
                });
            }
        });
    });
};


  
// Обновление Access Token
const refreshToken = (req, res) => {
    const refreshTokenFromStorage = req.params.token;
  
    if (!refreshTokenFromStorage) {
      return res.status(401).json({ error: 'Отсутствует refreshToken в запросе' });
    }
  
    connsql.query('SELECT * FROM UserToken WHERE refreshToken = ?', [refreshTokenFromStorage], (err, result) => {
      if (err) {
        console.error('Ошибка при проверке refreshToken в базе данных: ', err);
        return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
      }
  
      if (result.length === 0) {
        return res.status(403).json({ error: 'Недействительный refreshToken' });
      }
  
      jwt.verify(refreshTokenFromStorage, global.REFRESH_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          console.error('Ошибка при проверке валидности refreshToken:', err);
          connsql.query('DELETE FROM UserToken WHERE refreshToken = ?', [refreshTokenFromStorage], (deleteErr, deleteResult) => {
            if (deleteErr) {
              console.error('Ошибка при удалении refreshToken из базы данных:', deleteErr);
            }
            //localStorage.removeItem('refreshToken');
            return res.status(403).json({ error: 'Недействительный refreshToken' });
          });
        } else {
            const accessToken = jwt.sign({ 
              username: decoded.username, 
              guestMode: decoded.guestMode, 
              currentTheme: decoded.currentTheme, 
              error: decoded.error 
            }, global.ACCESS_TOKEN_SECRET, { expiresIn: global.ACCESS_TOKEN_EXPIRATION });
  
            return res.status(200).json({ accessToken: accessToken });
        }
      });
    });
  };
  
  const checkRefreshToken = (req, res) => {
    console.log("Я хоть тут1");
    const { refreshToken, refreshTokenExpiration } = req.body; 
    console.log(refreshToken);
    console.log("--");
    console.log(refreshTokenExpiration);
    if (!refreshToken) {
      return res.status(400).json({ error: 'Отсутствует refreshToken в запросе' });
    }
    connsql.query('SELECT * FROM UserToken WHERE refreshToken = ?', [refreshToken], (err, result) => {
      console.log("Я хоть тут2");
      if (err) {
        console.error('Ошибка при проверке refreshToken в базе данных:', err);
        console.log("Я хоть тут3");
        return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
      }
      if (result.length === 0) {
        console.log("Я хоть тут4");
        //localStorage.removeItem('refreshToken');
        //localStorage.removeItem('accessToken');
        return res.status(404).json({ error: 'refreshToken не найден' });
      }
      console.log("Я хоть тут5");
      const dbRefreshToken = result[0];
      const dbExpiration = dbRefreshToken.expiresIn;
      const expirationMoment = moment(dbExpiration);
      const formattedExpiration = expirationMoment.format('YYYY-MM-DD HH:mm:ss');
      console.log(refreshTokenExpiration);
      console.log(formattedExpiration);
  
      if (refreshTokenExpiration && refreshTokenExpiration === formattedExpiration) {
        console.log("Я хоть тут6");
        return res.status(200).json({ massage: "Всё ок" });
      } else {
        console.log("Я хоть тут7");
        connsql.query('DELETE FROM UserToken WHERE refreshToken = ?', [refreshToken], (deleteErr, deleteResult) => {
          if (deleteErr) {
            console.log("Я хоть тут8");
            console.error('Ошибка при удалении refreshToken из базы данных:', deleteErr);
          }
        });
        console.log("Я хоть тут9");
        //localStorage.removeItem('refreshToken');
        //localStorage.removeItem('refreshTokenExpiration');
        //localStorage.removeItem('accessToken');
        return res.status(401).json({ error: 'refreshToken не найден в локальном хранилище или истек его срок действия' });
      }
    });
  };
  
  
  
  const logoutUser = (req, res) => {
    const { refreshToken } = req.body; 
    console.log("refreshToken: " + refreshToken);
    if (!refreshToken) {
      return res.status(400).json({ error: 'Отсутствует refreshToken в запросе' });
    }

    jwt.verify(refreshToken, global.REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err) {
          console.error('Ошибка при проверке валидности refreshToken:', err);
          return res.status(401).json({ error: 'Недействительный токен' });
      }
      // Проверяем refreshToken в базе данных и удаляем его, если он существует
      connsql.query('DELETE FROM UserToken WHERE refreshToken = ?', [refreshToken], (err, result) => {
        if (err) {
          console.error('Ошибка при удалении refreshToken из базы данных:', err);
          return res.status(500).json({ error: 'Ошибка сервера' });
        } else {
          console.log('refreshToken успешно удалён из базы данных');
          return res.status(200).json({ message: 'Вы успешно вышли из системы' });
        }
      });
    });
  };
  const deleteRefreshToken = (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Отсутствует refreshToken в запросе' });
    }
    connsql.query('DELETE FROM UserToken WHERE refreshToken = ?', [refreshToken], (deleteErr, deleteResult) => {
      if (deleteErr) {
        console.error('Ошибка при удалении refreshToken из базы данных:', deleteErr);
        return res.status(500).json({ error: 'Ошибка при удалении refreshToken из базы данных' });
      }
      console.log('Токен успешно удален из базы данных');
      return res.status(200).json({ message: 'Токен успешно удален из базы данных' });
    });
  };
  const getUserByRefreshToken = (refreshToken, callback) => {
    // Поиск refreshToken в таблице UserToken
    const refreshTokenQuery = 'SELECT user FROM UserToken WHERE refreshToken = ?';
    connsql.query(refreshTokenQuery, [refreshToken], (err, result) => {
      if (err) {
        console.error('Ошибка при поиске refreshToken в базе данных:', err);
        callback(err, null);
      } else {
        if (result.length === 0) {
          // Если refreshToken не найден, возвращаем ошибку
          const error = 'refreshToken не найден в базе данных';
          callback(error, null);
        } else {
          // Если refreshToken найден, получаем логин пользователя
          const username = result[0].user;
          // Запрос к таблице newusers для получения данных пользователя
          const getUserQuery = 'SELECT * FROM newusers WHERE login = ?';
          connsql.query(getUserQuery, [username], (userErr, userResult) => {
            if (userErr) {
              console.error('Ошибка при получении данных пользователя из базы данных:', userErr);
              callback(userErr, null);
            } else {
              // Возвращаем данные пользователя
              const user = userResult[0];
              callback(null, user);
            }
          });
        }
      }
    });
  };
  const getUserByRefreshTokenHandler = (req, res) => {
    const refreshToken = req.query.refreshToken;
    getUserByRefreshToken(refreshToken, (err, user) => {
      if (err) {
        console.error('Ошибка при получении данных пользователя:', err);
        res.status(500).json({ error: 'Ошибка при получении данных пользователя' });
      } else {
        res.status(200).json(user);
      }
    });
  };
module.exports = {
    loginAdmin,
    registerUser,
    loginUser,
    logoutUser,
    deleteRefreshToken, 
    refreshToken,
    checkRefreshToken, 
    updateTokensWithTheme,
    getUserByRefreshTokenHandler
};
