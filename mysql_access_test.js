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

 for(var i=0;i<numRows;i++){
	 console.log(rows[i]['rank_title']);
 } 
 

  
});

connection.end();