const express = require('express');
const cors = require('cors')
const md5 = require('md5')
const app = express();
const port = 3001;
const mysql = require('mysql2');
const connsql = mysql.createConnection({
    host:"79.174.88.169",
    port: "15901",
    user:"admin",
    password:"KKiriLL2114!",
    database:"CoffeeGodine"
});

app.use(cors({ origin: "*" }));
app.listen(port, ()=>{
    console.log('server ok');
    connsql.connect(err =>{
        if (err){console.log(err);}
        else {console.log('database ok');}
    })
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
            let query1 = "UPDATE Tovar SET " + req.body.pole + " = '" + req.body.value + "' WHERE Tovar.id = " + req.body.id;
            connsql.query(query1)
        }
    })
});

app.post('/api/TovarUpdate', (req, res) => {
    let query = 'select price from Tovar';

    connsql.query(query,(err,result,field) => {
        res.json(result);
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