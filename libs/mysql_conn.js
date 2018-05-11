var mysql = require('mysql');
var connection = mysql.createPool({
    host: "api.kairoslogistic.com",
    port: "3306",
    user: "gio",
    password: "Jordan123",
    database: "crypto",
});

connection.connect(function(err) {
    if (err) throw err;
});

module.exports = connection;
