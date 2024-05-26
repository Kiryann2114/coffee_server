const https = require('https');
const { fastRandString } = require('../utils');
const { sendMail } = require('../mailer');
const connsql = require('../database');

// Generate payment URL for user
function getPaymentURL(req, res) {
    let arrItems = [];
    let arrBasket = req.body.basket.split(",");
    arrItems.push({
        description: 'Доставка',
        amount: { value: req.body.delprice, currency: 'RUB' },
        vat_code: 1,
        quantity: "1",
        measure: 'piece',
        payment_subject: 'service',
        payment_mode: 'full_payment',
    });

    let arrID = arrBasket.map(item => item.split(":")[0]).join(",");

    let query = `SELECT price, name FROM Tovar WHERE id in (${arrID})`;
    connsql.query(query, (err, result) => {
        if (err) {
            console.error('Error during GetPaymentURL:', err);
            res.status(500).send('Server error');
        } else {
            for (let i = 0; i < arrBasket.length; i++) {
                let [itemId, itemQty] = arrBasket[i].split(":");
                arrItems.push({
                    description: result[i].name,
                    amount: { value: `${result[i].price}.00`, currency: 'RUB' },
                    vat_code: 1,
                    quantity: itemQty,
                    measure: 'piece',
                    payment_subject: 'commodity',
                    payment_mode: 'full_payment',
                });
            }
            const url = 'https://api.yookassa.ru/v3/payments';
            const base64Credentials = Buffer.from('369984:test_3l-27_egpYA4GB8lsVLx1W5QxR0CGDxRQLG6X_VMHvk').toString('base64');
            const idempotenceKey = fastRandString();
            const requestData = {
                amount: { value: `${Number(req.body.baskCount) + Number(req.body.delprice)}.00`, currency: 'RUB' },
                capture: true,
                confirmation: {
                    type: 'redirect',
                    return_url: 'https://godinecoffee.ru/',
                },
                receipt: {
                    customer: {
                        email: req.body.mail,
                    },
                    items: arrItems,
                },
                description: `Оплата заказа для ${req.body.mail}`
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
                    const paymentUrl = JSON.parse(data).confirmation.confirmation_url;
                    res.json(paymentUrl);
                    console.log(paymentUrl);

                    let textHtml = `<p>Заказ: ${JSON.parse(data).id} сформирован. После оплаты мы соберём заказ и отправим вам.</p>`;
                    await sendMail(req.body.mail.toLowerCase(), `Заказ для ${req.body.mail.toLowerCase()}`, 'Это сообщение отправлено для заказа.', textHtml);

                    let textHtml1 = `<p>Заказ сформирован: ${JSON.parse(data).id}</p><br/><p> Имя: ${req.body.name}</p><br/><p> Телефон: ${req.body.tel.replace(/[()\-\+]/g, '')}</p><br/><p> Почта: ${req.body.mail.toLowerCase()}</p>`;
                    await sendMail("zakaz@godinecoffee.ru", `Заказ для ${req.body.mail.toLowerCase()}`, 'Это сообщение отправлено для заказа.', textHtml1);
                });
            });

            request.on('error', (error) => {
                console.error('Error:', error);
                res.status(500).send('Server error');
            });

            request.write(requestDataString);
            request.end();
        }
    });
}

module.exports = {
    getPaymentURL
};
