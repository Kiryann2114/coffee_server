const express = require('express');
const cors = require('cors')
const md5 = require('md5')
const nodemailer = require('nodemailer');
const app = express();
const port = 3001;
const https = require('node:https');
const fs = require('node:fs');
const mysql = require('mysql2');

function fastRandString() {
    return [...Array(50)].map(() => (~~(Math.random() * 36)).toString(36)).join('');
}

async function sendMail(email, theme, text, textHtml) {

    let transporter = nodemailer.createTransport({
        host: "smtp.yandex.ru",
        port: 25,
        secure: false,
        auth: {
            user: 'info@godinecoffee.ru',
            pass: 'gckpbjasgcbcybxe'
        }
    });

    let message = {
        from: 'GodineCoffee <info@godinecoffee.ru>',
        to: email,
        subject: theme,
        text: text,
        html: textHtml
    }

    await transporter.sendMail(message)
}

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
    let query = 'select count(*) <> 0 as res from users where id = 0 and mail = "' + req.body.mail.toLowerCase() + '" and password = "' + md5(req.body.pass) + '"';

    connsql.query(query,(err,result,field) => {
        res.json(result[0]);
    })
});

app.post('/api/deleteItem', (req, res) => {
    let query = 'select count(*) <> 0 as res from users where id = 0 and mail = "' + req.body.mail.toLowerCase() + '" and password = "' + md5(req.body.pass) + '"';
    connsql.query(query,(err,result,field) => {
        if(result[0]){
            let query1 = "DELETE FROM Tovar WHERE Tovar.id = " + req.body.id;
            connsql.query(query1)
        }
    })
});

app.post('/api/addItem', (req, res) => {
    let query = 'select count(*) <> 0 as res from users where id = 0 and mail = "' + req.body.mail.toLowerCase() + '" and password = "' + md5(req.body.pass) + '"';
    connsql.query(query,(err,result,field) => {
        if(result[0]){
            let query1 = 'SELECT MAX(id)+1 as ID FROM Tovar';
            connsql.query(query1,(err,result,field) => {
                let query2 = "INSERT INTO Tovar (id, name, opisanie, price, optprice, price250, optprice250) VALUES ('" + result[0].ID + "', '', '', '0', '0', '0', '0')";
                connsql.query(query2)
            })
        }
    })
});

app.post('/api/UpdateItem', (req, res) => {
    let query = 'select count(*) <> 0 as res from users where id = 0 and mail = "' + req.body.mail.toLowerCase() + '" and password = "' + md5(req.body.pass) + '"';
    connsql.query(query,(err,result,field) => {
        if(result[0]){
            let query1 = "UPDATE Tovar SET name = '" + req.body.name + "', opisanie = '" + req.body.opisanie + "' ,price = '" + req.body.price + "', optprice = '" + req.body.optprice + "', price250 = '" + req.body.price250 + "', optprice250 = '" + req.body.optprice250 + "' WHERE Tovar.id = " + req.body.id;
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
    let query = 'select count(*) <> 0 as res from users where mail = "' + req.body.mail.toLowerCase() + '" and password = "' + md5(req.body.pass) + '"';

    connsql.query(query,(err,result,field) => {
        res.json(result[0]);
    })
});

app.post('/api/RegUser', (req, res) => {
    let query = 'select count(*) as res from users where mail = "' + req.body.mail.toLowerCase() + '"';
    connsql.query(query,(err,result,field) => {
        if(result[0].res === 0){
            let query1 = 'select max(id)+1 as res from users';
            connsql.query(query1,(err,resu,field) => {
                let query2 = "INSERT INTO users (password, name, mail, tel, addres, korzina, liked, id) VALUES ('"+ md5(req.body.pass) +"', '"+ req.body.name +"', '"+ req.body.mail.toLowerCase() +"', '"+ req.body.tel +"', '', '', '', '"+ resu[0].res +"')"
                connsql.query(query2,(err,resu,field) => {
                    res.json(result[0]);
                })
            })
        }
        else {
            res.json(result[0]);
        }
    })
});

app.post('/api/UpdateBasket', (req, res) => {
    let query = 'select count(*) <> 0 as res from users where mail = "' + req.body.mail.toLowerCase() + '" and password = "' + md5(req.body.pass) + '"';
    connsql.query(query,(err,result,field) => {
        if(result[0]){
            let query1 = 'UPDATE users SET korzina = "' + req.body.value + '" WHERE mail = "' + req.body.mail.toLowerCase() + '" and password = "' + md5(req.body.pass) + '"';
            connsql.query(query1)
        }
    })
});

app.post('/api/GetBasket', (req, res) => {
    let query = 'Select korzina as res from users WHERE mail = "' + req.body.mail.toLowerCase() + '" and password = "' + md5(req.body.pass) + '"';
    connsql.query(query,(err,result,field) => {
        res.json(result[0]);
    })
});

app.post('/api/GetInfoUser', (req, res) => {
    let query = 'Select name, mail, tel from users WHERE mail = "' + req.body.mail.toLowerCase() + '" and password = "' + md5(req.body.pass) + '"';
    connsql.query(query,(err,result,field) => {
        res.json(result[0]);
    })
});

app.post('/api/UpdateInfoUser', (req, res) => {
    let query = ""
    if(req.body.pass !== "" && req.body.passp !== ""){
        query = 'UPDATE users SET password = "' + md5(req.body.passp) + '",name = "' + req.body.name + '",mail = "' + req.body.mail.toLowerCase() + '",tel = "' + req.body.tel + '" WHERE mail = "' + req.body.maillog.toLowerCase() + '" and password = "' + md5(req.body.pass) + '"';
    }
    else {
        query = 'UPDATE users SET name = "' + req.body.name + '",mail = "' + req.body.mail.toLowerCase() + '",tel = "' + req.body.tel + '" WHERE mail = "' + req.body.maillog.toLowerCase() + '" and password = "' + md5(req.body.passlog) + '"';
    }
    connsql.query(query)
});

app.post('/api/SendMailReset',(req, res) => {
    console.log("send email " + req.body.mail.toLowerCase())
    let query = 'Select password from users WHERE mail = "' + req.body.mail.toLowerCase() + '"'
    connsql.query(query,(err, result, field) => {
        if (result[0]) {
            let url = req.body.mail.toLowerCase() + "=" + result[0].password

            let query1 = "INSERT INTO reset (url) VALUES ('"+ url +"')"
            connsql.query(query1,async (err, result, field) => {
                if(err)
                {
                    let textHtml = "<a href=https://godinecoffee.ru/resetURL?" + url + ">Перейдите по ссылке для восстановления пароля</a>"

                    await sendMail(req.body.mail.toLowerCase(), 'Восстановление пароля', 'Это сообщение отправлено для восстановления пароля.', textHtml)
                    res.json({status: "ok"});
                }
                else {
                    let textHtml = "<a href=https://godinecoffee.ru/resetURL?" + url + ">Перейдите по ссылке для восстановления пароля</a>"

                    await sendMail(req.body.mail.toLowerCase(), 'Восстановление пароля', 'Это сообщение отправлено для восстановления пароля.', textHtml)
                    res.json({status: "ok"});
                }
            })
        }
    })

});

app.post('/api/ResetPass', async (req, res) => {
    if(req.body.url !== "0" && req.body.url !== ""){

        let query = 'select count(*) <> 0 as res from reset where url = "' + req.body.url + '"'

        connsql.query(query,(err,result,field) => {
            if(result[0].res !== 0){
                let query1 = 'UPDATE users SET password = "' + md5(req.body.pass) + '" WHERE mail = "' + req.body.url.split("=")[0] + '"';
                connsql.query(query1)

                let query2 = "DELETE FROM reset WHERE reset.url LIKE '" + req.body.url + "%'"
                connsql.query(query2)

                res.json({status: "ok"});
            }
        })
    }
});

app.post('/api/GetPaymentURL', (req, res) => {

    let arrItems = []

    let arrBasket = req.body.basket.split(",")

    arrItems.push({
        description:'Доставка ' + req.body.adress,
        amount: { value: req.body.delprice, currency: 'RUB' },
        vat_code:1,
        quantity:"1",
        measure:'piece',
        payment_subject:'service',
        payment_mode:'full_payment',
    });

    let arrID = ""

    for(let i = 0; i < arrBasket.length; i++) {

        let Item = arrBasket[i].split(":")

        if(i === arrBasket.length-1){
            arrID += Item[0].split("_")[0]
        }
        else {
            arrID += Item[0].split("_")[0] + ","
        }
    }

    let query = 'SELECT price,price250,name FROM Tovar WHERE id in (' + arrID + ')'

    let query1 = 'select sale as res from PromoCods where code = "' + req.body.Promo.toUpperCase() + '"';

    let query2 = 'select count(*) <> 0 as res from PromoCods where code = "' + req.body.Promo.toUpperCase() + '"';

    let query3 = 'select HistoryPromo as res from users where mail = "' + req.body.Mail.toLowerCase() + '" and password = "' + md5(req.body.Pass) + '"';

    let query4 = 'select HistoryPromo from users where mail = "' + req.body.Mail.toLowerCase() + '" and password = "' + md5(req.body.Pass) + '"';

    let PromoSale = 1;

    if(req.body.Promo!==""){
        console.log(1)
        connsql.query(query2,(err,result2,field) => {
            if(result2[0].res!==0){
                console.log(2)
                connsql.query(query3,(err,result3,field) => {
                    let arr = result3[0].res.split(' ')
                    let r = false;
                    for (let i = 0; i < arr.length; i++) {
                        if (arr[i] === req.body.Promo) {
                            r = true;
                        }
                    }
                    if(!r){
                        console.log(3)
                        connsql.query(query1,(err,result1,field) => {
                            PromoSale = 1-(Number(result1[0].res)*0.01);
                            console.log(PromoSale)
                            GetURL()
                            connsql.query(query4,(err4,result4,field4) => {
                                let HP = result4[0].HistoryPromo + ' ' + req.body.PromoCode.toUpperCase();
                                console.log(HP)
                                let query5 = 'UPDATE users SET HistoryPromo = "' + HP + '" WHERE mail = "' + req.body.Mail.toLowerCase() + '" and password = "' + md5(req.body.Pass) + '"';
                                connsql.query(query5,(err5,result5,field5) => {})
                            })
                        })
                    }
                })
            }
        })
    }
    else{
        GetURL()
    }

    function GetURL() {
        connsql.query(query,(err,result,field) => {

            for(let i = 0; i < arrBasket.length; i++) {

                let Item = arrBasket[i].split(":")
                if(arrBasket[i].split(":")[0].split("_")[1] === "1"){
                    arrItems.push({
                        description:result[i].name,
                        amount: { value: String(Number(result[i].price) * PromoSale) + '.00', currency: 'RUB' },
                        vat_code:1,
                        quantity:Item[1],
                        measure:'piece',
                        payment_subject:'commodity',
                        payment_mode:'full_payment',
                    });
                }
                else {
                    arrItems.push({
                        description:result[i].name,
                        amount: { value: String(Number(result[i].price250) * PromoSale) + '.00', currency: 'RUB' },
                        vat_code:1,
                        quantity:Item[1],
                        measure:'piece',
                        payment_subject:'commodity',
                        payment_mode:'full_payment',
                    });
                }
            }
            const url = 'https://api.yookassa.ru/v3/payments';
            const base64Credentials = Buffer.from('327023:live_0yM2r3_HHZgB07NQAGeMds1DButp4MfGl2nKzcCU-lo').toString('base64');
            const idempotenceKey = fastRandString();
            console.log(arrItems);
            const requestData = {
                amount: { value: String( (Number(req.body.baskCount) * PromoSale) + Number(req.body.delprice)) + '.00', currency: 'RUB' },
                capture: true,
                confirmation: {
                    type: 'redirect',
                    return_url: 'https://godinecoffee.ru/'
                },
                receipt:{
                    customer:{
                        email:req.body.mail,
                    },
                    items:arrItems
                },
                description: 'Оплата заказа для ' + req.body.mail
            };
            const requestDataString = JSON.stringify(requestData);

            const options = {
                hostname: 'api.yookassa.ru',
                path: '/v3/payments',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${base64Credentials}`,
                    'Idempotence-Key': idempotenceKey,
                    'Content-Length': Buffer.byteLength(requestDataString)
                }
            };

            const request = https.request(options, (resp) => {
                let data = '';
                resp.on('data', (chunk) => {
                    data += chunk;
                });

                resp.on('end', async () => {
                    res.json(JSON.parse(data).confirmation.confirmation_url);
                    console.log(JSON.parse(data).confirmation.confirmation_url);

                    let textHtml = "<p>заказ: "+ JSON.parse(data).id+" сформирован. После оплаты мы соберём заказ и отправим вам.</p>"

                    await sendMail(req.body.mail.toLowerCase(), "Заказ для " + req.body.mail.toLowerCase(), 'Это сообщение отправлено для заказа.', textHtml)

                    let textHtml1 = "<p>заказ сформирован: "+ JSON.parse(data).id +"</p><br/><p> имя: "+ req.body.name +"</p><br/><p> телефон: "+ req.body.tel.replace("(", '').replace(")", '').replace("+", '').replace("-", '') +"</p><br/><p> почта: "+ req.body.mail.toLowerCase() +"</p>"

                    await sendMail("zakaz@godinecoffee.ru", "Заказ для " + req.body.mail.toLowerCase(), 'Это сообщение отправлено для заказа.', textHtml1)
                });
            });

            request.on('error', (error) => {
                console.error('Error:', error);
            });

            request.write(requestDataString);
            request.end();
        })
    }
});

app.post('/api/checkPromo', (req, res) => {
    let query = 'select count(*) <> 0 as res from PromoCods where code = "' + req.body.Promo.toUpperCase() + '"';

    connsql.query(query,(err,result,field) => {
        res.json(result[0]);
    })
});

app.post('/api/GetUserHistoryPromo', (req, res) => {
    let query = 'select HistoryPromo as res from users where mail = "' + req.body.mail.toLowerCase() + '" and password = "' + md5(req.body.pass) + '"';

    connsql.query(query,(err,result,field) => {
        res.json(result[0]);
    })
});

app.post('/api/UpdateHistoryPromo', (req, res) => {
    let query1 = 'select HistoryPromo from users where mail = "' + req.body.mail.toLowerCase() + '" and password = "' + md5(req.body.pass) + '"';

    connsql.query(query1,(err,result,field) => {
        let HP = result[0].HistoryPromo + ' ' + req.body.PromoCode.toUpperCase();
        let query2 = 'UPDATE users SET HistoryPromo = "' + HP + '" WHERE mail = "' + req.body.mail.toLowerCase() + '" and password = "' + md5(req.body.pass) + '"';
        connsql.query(query2,(err,result,field) => {})
    })
});

app.post('/api/GetProsent', (req, res) => {
    let query = 'select sale as res from PromoCods where code = "' + req.body.Promo.toUpperCase() + '"';

    connsql.query(query,(err,result,field) => {
        res.json(result[0]);
    })
});