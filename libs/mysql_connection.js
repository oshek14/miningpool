var mysql = require('mysql');

module.exports = function(){
    var host="api.kairoslogistic.com";
    var user="root";
    var password="Jordan123";
    var database="test_1";
    var port="3306";
    connectToMysql = function() {
        var connection = mysql.createPool({
            host: host,
            port: port,
            user: user,
            password: password,
            database: database,
        });
        var data=[
            'nice_onehah'
        ]
        connection.query(
            'INSERT INTO `test_2` SET value = ?',
            data,
            function(err, result) {
                if (err)
                    console.log(err);
                else
                    console.log("good inserted");
            }
        );
    }
}
  
  


