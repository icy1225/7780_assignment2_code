var mysql = require('mysql2');

var con = mysql.createConnection({
host: "localhost",
user: "user99",
password: "user99",
database: "comp7780"
});

con.connect(function(err) {
	if (err) throw err;
	console.log("Connected!");
	con.end();
});
