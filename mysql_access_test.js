var mysql      = require('mysql');
var sql_queries = require('./sql_queries');
var dbInfo = {
  host     : 'localhost',
  user     : 'ShareWhereUser',
  password : 'N3onIc3d',
  database : 'sharewheretest'
};
var connection = mysql.createConnection(dbInfo);

var connectionTesting = false;
var addUserTesting = false;
var removeUserTesting = false;
var addShareableTesting = true;

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
	sql_queries.addUser(dbInfo, testUser, function(err, rows, fields){
		if(err){
			console.log("error in test addUser: "+err);
		}
		console.log(rows);
	});
}

if(removeUserTesting){
	console.log("Attempting to remove user %j", testUser);
	sql_queries.removeUser(dbInfo, testUser.username, function(err, rows, fields){
		if(err){
			console.log("error in test removeUser: "+err);
		}
		console.log(rows);
	});
}

if(addShareableTesting){
	shareable = {
		shar_name: "broom",
		shareableState: "requesting",
		description: "Oi, I need a broom to sweep me kitchen."
	};
	uploadingUser = {
		username: "tj"
	};
	sql_queries.addShareable(dbInfo, shareable, uploadingUser,  function(err, rows, fields){
		if(err){
			console.log("error in test removeUser: "+err);
		}
		console.log(rows);
	});
}
connection.end();