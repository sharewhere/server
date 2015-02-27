var mysql      = require('mysql');
var sql_queries = require('./sql_queries');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'ShareWhereUser',
  password : 'N3onIc3d',
  database : 'sharewheretest'
});

var connectionTesting = false;
var addUserTesting = true;


connection.connect();

if(connectionTesting){
	connection.query("SELECT * from users where username = 'tj'", function(err, rows, fields) {
	  if (err) throw err;

	 var numRows = rows.length;

	 console.log(rows);
	 console.log(Object.keys(rows[0]));

	  
	});
}

var testUser = {
	username: "TestGuy",
	password: "testPass",
	email_address: "co@de.com"
};

if(addUserTesting){
    console.log("Attempting to add user %j", testUser);
	sql_queries.addUser(connection, testUser, function(err, rows, fields){
		if(err){
			console.log("error in test addUser: "+err);
		}
		console.log(rows);
	});
}
