/*
    index.js
    Entry point for the app.
    To start: node index.js
*/

var express = require('express');
var app = express();

// 配置中间件以解析 POST 请求的表单数据和 JSON 数据
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 定义静态资源目录
app.use(express.static('public'));
app.use('/css', express.static(__dirname + '/css'));
app.use('/images', express.static(__dirname + '/images'));
app.use('/pics', express.static(__dirname + '/pics')); // 添加这一行，映射 pics 目录

// 主页路由
app.get('/', function(req, res) {
    res.sendFile(__dirname + "/comp7780_home.html");
});

// 产品页面路由
app.get('/product', function(req, res) {
    res.sendFile(__dirname + "/comp7780_product.html");
});

// 添加到购物车路由（改为 POST 方法）
app.post('/cart', function(req, res) {
    var prod_id = req.body.prod_id;
    var qty = req.body.qty;
    var price = req.body.price;
    var f_username = req.body.f_username;

    var responseText = 'Prod_id: ' + prod_id + '<br>';
    responseText += 'Qty: ' + qty + '<br>';
    responseText += 'Price: ' + price + '<br>';
    responseText += 'Username: ' + f_username + '<br><br>';

    var now = new Date();
    var cur_date_yyyy_mm_dd = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();
    console.log("cur_date_yyyy_mm_dd is: " + cur_date_yyyy_mm_dd);

    var mysql = require('mysql2');
    var con = mysql.createConnection({
        host: "localhost",
        user: "user99",
        password: "user99",
        database: "comp7780"
    });

    con.connect(function(err) {
        if (err) {
            console.error('Database connection error:', err);
            responseText += 'Error connecting to database. Please try again later.';
            res.send(responseText);
            return;
        }

        var sql = "INSERT INTO cart (cust_username, cart_order_date, prod_id, cart_qty, cart_price) VALUES (?, ?, ?, ?, ?)";
        con.query(sql, [f_username, cur_date_yyyy_mm_dd, prod_id, qty, price], function(err, result) {
            if (err) {
                console.error('Database query error:', err);
                responseText += 'MySQL ERROR: Item not added!<br>';
                responseText += '<br><br>';
                responseText += '<input type="button" value="Close this page" onclick="self.close();" />';
                res.send(responseText);
                con.end();
                return;
            }

            console.log(result);
            console.log('Affected rows:', result.affectedRows);

            if (result.affectedRows > 0) {
                responseText += 'Thank you for your order! ' + f_username + '<br>';
                responseText += 'The above item has been added to your shopping cart. <br>';
            } else {
                responseText += 'MySQL ERROR: Item not added!<br>';
            }
            responseText += '<br><br>';
            responseText += '<input type="button" value="Close this page" onclick="self.close();" />';
            res.send(responseText);
            con.end();
        });
    });
});

// 结账路由（POST 方法）
app.post('/check_out', function(req, res) {
    var username = req.body.f_check_out_username;
    var cartData = req.body.cart_data;

    console.log('Checkout request received:', { username, cartData });

    var responseText = '<!DOCTYPE html>';
    responseText += '<head><meta name="viewport" content="width=device-width, initial-scale=1">';
    responseText += '<meta http-equiv="X-UA-Compatible" content="IE=edge" /></head>';
    responseText += '<body><script src="https://www.paypal.com/sdk/js?client-id=ATSWa9vavLRPYABa5DAFOb7d6xFXlYIfpC4eE0ML-fo4wvxD7MhswAQkklI625Mqnbudf6psDaPUC5mj">';
    responseText += '</script>';

    var mysql = require('mysql2');
    var con = mysql.createConnection({
        host: "localhost",
        user: "user99",
        password: "user99",
        database: "comp7780"
    });

    con.connect(function(err) {
        if (err) {
            console.error('Database connection error:', err);
            responseText += 'Error connecting to database. Please try again later.';
            responseText += '</body></html>';
            res.send(responseText);
            return;
        }

        // 使用参数化查询防止 SQL 注入
        var sql = "SELECT DATE_FORMAT(cart.cart_order_date, '%Y-%m-%d') AS order_date, " +
            "cart.prod_id, product.prod_desc, cart.cart_qty, cart.cart_price " +
            "FROM cart " +
            "INNER JOIN product ON cart.prod_id = product.prod_id " +
            "WHERE cart.cust_username = ? " +
            "ORDER BY order_date ASC, prod_id DESC;";
        console.log('Executing SQL:', sql, 'with username:', username);

        con.query(sql, [username], function(err, result) {
            if (err) {
                console.error('Database query error:', err);
                responseText += 'Error retrieving order details. Please try again later.';
                responseText += '</body></html>';
                res.send(responseText);
                con.end();
                return;
            }

            console.log('Query result:', result);

            responseText += 'Thank you for your order! ' + username + '<br>';
            responseText += 'Your order details: <br><br>';
            responseText += '<table border="2">';
            responseText += '<tr><th>Original Order Date</th><th>Product ID</th><th>Product Description</th><th>Quantity</th><th>Price</th><th>Amount</th></tr>';

            var total_due = 0;
            var sub_total = 0;
            if (result.length === 0) {
                responseText += '<tr><td colspan="6">No items found in your cart.</td></tr>';
            } else {
                for (var i = 0; i < result.length; i++) {
                    sub_total = result[i].cart_qty * result[i].cart_price;
                    responseText += '<tr><td>' + result[i].order_date + '</td><td>' + result[i].prod_id + '</td><td>' + result[i].prod_desc + '</td><td>' + result[i].cart_qty + '</td><td>' + result[i].cart_price + '</td><td>' + sub_total + '</td></tr>';
                    total_due += sub_total;
                }
            }
            responseText += '</table>';
            responseText += '<br>Total Due: ' + total_due.toFixed(2);
            responseText += '<br><br>';

            responseText += '<div id="paypal-button-container"></div>';
            responseText += '<p id="txt1"></p>';
            responseText += '<script>';
            responseText += 'paypal.Buttons({';
            responseText += 'createOrder: function(data, actions) {';
            responseText += 'return actions.order.create({';
            responseText += 'purchase_units: [{';
            responseText += 'amount: {';
            responseText += 'value: ' + total_due + '}';
            responseText += '}]';
            responseText += '});';
            responseText += '},';
            responseText += 'onApprove: function(data, actions) {';
            responseText += 'return actions.order.capture().then(function(details) {';
            responseText += 'alert("Transaction completed by " + details.payer.name.given_name);';
            responseText += 'document.querySelector("#txt1").innerHTML = "Payment has completed! This web page can be closed now!";';
            responseText += 'document.querySelector("#txt1").style.backgroundColor = "yellow";';
            responseText += 'document.querySelector("#txt1").style.color = "red";';
            // 支付成功后清空购物车
            responseText += 'fetch("/clear_cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ f_username: "' + username + '" }) });';
            responseText += '});';
            responseText += '}';
            responseText += '}).render("#paypal-button-container");';
            responseText += '</script>';
            responseText += '</body></html>';

            res.send(responseText);
            con.end();
        });
    });
});

// 清空购物车路由
app.post('/clear_cart', function(req, res) {
    var username = req.body.f_username;

    var mysql = require('mysql2');
    var con = mysql.createConnection({
        host: "localhost",
        user: "user99",
        password: "user99",
        database: "comp7780"
    });

    con.connect(function(err) {
        if (err) {
            console.error('Database connection error:', err);
            res.send('Error connecting to database');
            return;
        }

        var sql = "DELETE FROM cart WHERE cust_username = ?";
        con.query(sql, [username], function(err, result) {
            if (err) {
                console.error('Database query error:', err);
                res.send('Error clearing cart');
                con.end();
                return;
            }

            console.log('Cart cleared for user:', username, 'Affected rows:', result.affectedRows);
            res.send('Cart cleared');
            con.end();
        });
    });
});

// 启动服务器
app.listen(8080, function() {
    console.log('index.js listening to http://127.0.0.1:8080/ or http://localhost:8080/');
});

console.log('End of Program.');