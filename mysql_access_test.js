var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'ShareWhereUser',
  password : 'N3onIc3d',
  database : 'sharewheretest'
});

connection.connect();

connection.query('SELECT * from ranks', function(err, rows, fields) {
  if (err) throw err;

 var numRows = rows.length;

 console.log(rows);
 console.log(Object.keys(rows[0]));

  
});

connection.end();