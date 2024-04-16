const express = require('express');
const cors = require('cors')
const md5 = require('md5')
const nodemailer = require('nodemailer');
const app = express();
const port = 3001;
const https = require('node:https');
const fs = require('node:fs');
const mysql = require('mysql2');

async function sendMail(email, theme, text, textHtml) {

    let transporter = nodemailer.createTransport({
        service: 'Yandex',
        auth: {
            user: 'info@godinecoffee.ru',
            pass: 'gckpbjasgcbcybxe' },
    });

    let message = {
        from: 'info@godinecoffee.ru',
        to: email,
        subject: theme,
        text: text,
        html: textHtml
    }

    let info = await transporter.sendMail(message)
}

let textHtml = "<b>Привет мир!</b>"
console.log("kiryann888@gmail.com")
sendMail("kiryann888@gmail.com", 'Message from Node js', 'This message was sent from Node js server.', textHtml)

function connectToDatabase() {
    const dbConnection = mysql.createConnection({
        host:"37.140.192.191",
        user:"u2588670_root",
        password:"66AxnmyTLx3CS1ZR",
        database:"u2588670_GodineCoffee"
    });

    return dbConnection;
}

let connsql = connectToDatabase();

connsql.on('error', (err) => {
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('Соединение с базой данных потеряно. Повторное подключение...');
        connsql = connectToDatabase();
    } else {
        console.log('database ok');
        throw err;
    }
});

app.use(cors({ origin: "*" }));

const options = {
    key: fs.readFileSync('keys/PRIV.pem'),
    cert: fs.readFileSync('keys/CERT.pem'),
};

const server = https.createServer(options, app);

server.listen(port, ()=>{
    console.log('server ok');

})

app.get('/api/tovar',(req,res) => {

    let query = 'select * from Tovar';

    connsql.query(query,(err,result,field) => {
        res.json(result);
    })
})

app.use(express.json());

app.post('/api/loginAdmin', (req, res) => {
    let query = 'select count(*) <> 0 as res from users where id = 0 and mail = "' + req.body.mail + '" and password = "' + md5(req.body.pass) + '"';

    connsql.query(query,(err,result,field) => {
        res.json(result[0]);
    })
});

app.post('/api/deleteItem', (req, res) => {
    let query = 'select count(*) <> 0 as res from users where id = 0 and mail = "' + req.body.mail + '" and password = "' + md5(req.body.pass) + '"';
    connsql.query(query,(err,result,field) => {
        if(result[0]){
            let query1 = "DELETE FROM Tovar WHERE Tovar.id = " + req.body.id;
            connsql.query(query1)
        }
    })
});

app.post('/api/addItem', (req, res) => {
    let query = 'select count(*) <> 0 as res from users where id = 0 and mail = "' + req.body.mail + '" and password = "' + md5(req.body.pass) + '"';
    connsql.query(query,(err,result,field) => {
        if(result[0]){
            let query1 = 'SELECT MAX(id)+1 as ID FROM Tovar';
            connsql.query(query1,(err,result,field) => {
                let query2 = "INSERT INTO Tovar (id, name, opisanie, price, optprice) VALUES ('" + result[0].ID + "', '', '', '0', '0')";
                connsql.query(query2)
            })
        }
    })
});

app.post('/api/UpdateItem', (req, res) => {
    let query = 'select count(*) <> 0 as res from users where id = 0 and mail = "' + req.body.mail + '" and password = "' + md5(req.body.pass) + '"';
    connsql.query(query,(err,result,field) => {
        if(result[0]){
            let query1 = "UPDATE Tovar SET name = '" + req.body.name + "', opisanie = '" + req.body.opisanie + "' ,price = '" + req.body.price + "', optprice = '" + req.body.optprice + "' WHERE Tovar.id = " + req.body.id;
            connsql.query(query1)
        }
    })
});

app.post('/api/CountBasket', (req, res) => {
    let count = 0
    let strArr = req.body.basket.split(",")
    for (let i = 0; i < strArr.length; i++){
        let query = 'SELECT price*'+ strArr[i].split(":")[1] +' as price FROM `Tovar` WHERE id ='+ strArr[i].split(":")[0];
        connsql.query(query,(err,result,field) => {
            count = count + Number(result[0].price)
            if(i === strArr.length-1){
                res.json(count);
            }
        })
    }
});

app.post('/api/checkUser', (req, res) => {
    let query = 'select count(*) <> 0 as res from users where mail = "' + req.body.mail + '" and password = "' + md5(req.body.pass) + '"';

    connsql.query(query,(err,result,field) => {
        res.json(result[0]);
    })
});

app.post('/api/RegUser', (req, res) => {
    let query = 'select count(*) = 0 as res from users where mail = "' + req.body.mail + '"';
    connsql.query(query,(err,result,field) => {
        if(result[0]){
            let query1 = 'select max(id)+1 as res from users';
            connsql.query(query1,(err,resu,field) => {
                let query2 = "INSERT INTO users (password, name, mail, tel, addres, korzina, liked, id) VALUES ('"+ md5(req.body.pass) +"', '"+ req.body.name +"', '"+ req.body.mail +"', '"+ req.body.tel +"', '', '', '', '"+ resu[0].res +"')"
                connsql.query(query2,(err,resu,field) => {
                    res.json(result[0]);
                })
            })
        }
    })
});

app.post('/api/UpdateBasket', (req, res) => {
    let query = 'select count(*) <> 0 as res from users where mail = "' + req.body.mail + '" and password = "' + md5(req.body.pass) + '"';
    connsql.query(query,(err,result,field) => {
        if(result[0]){
            let query1 = 'UPDATE users SET korzina = "' + req.body.value + '" WHERE mail = "' + req.body.mail + '" and password = "' + md5(req.body.pass) + '"';
            connsql.query(query1)
        }
    })
});

app.post('/api/GetBasket', (req, res) => {
    let query = 'Select korzina as res from users WHERE mail = "' + req.body.mail + '" and password = "' + md5(req.body.pass) + '"';
    connsql.query(query,(err,result,field) => {
        res.json(result[0]);
    })
});

app.post('/api/GetInfoUser', (req, res) => {
    let query = 'Select name, mail, tel from users WHERE mail = "' + req.body.mail + '" and password = "' + md5(req.body.pass) + '"';
    connsql.query(query,(err,result,field) => {
        res.json(result[0]);
    })
});

app.post('/api/UpdateInfoUser', (req, res) => {
    let query = ""
    if(req.body.pass !== "" && req.body.passp !== ""){
        query = 'UPDATE users SET password = "' + md5(req.body.passp) + '",name = "' + req.body.name + '",mail = "' + req.body.mail + '",tel = "' + req.body.tel + '" WHERE mail = "' + req.body.maillog + '" and password = "' + md5(req.body.pass) + '"';
    }
    else {
        query = 'UPDATE users SET name = "' + req.body.name + '",mail = "' + req.body.mail + '",tel = "' + req.body.tel + '" WHERE mail = "' + req.body.maillog + '" and password = "' + md5(req.body.passlog) + '"';
    }
    connsql.query(query)
});

app.post('/api/SendMailReset', (req, res) => {
    let textHtml = "<b>Привет мир!</b>"
    console.log(req.body.mail)
    sendMail(req.body.mail, 'Message from Node js', 'This message was sent from Node js server.', textHtml)
});