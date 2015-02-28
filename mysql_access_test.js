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
var getUserTesting = false;
var getUsersShareablesTesting = false;
var addShareableTesting = false;
var removeSharableTesting = true;

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

if(getUserTesting){
	console.log("Attempting to get the user 'tj'");
	sql_queries.getUser(dbInfo, "tj", function(err, user){
		console.log("Retrieved user %j", user);
	});
}

if(getUsersShareablesTesting){
	var username = "tj";
	sql_queries.getUsersShareables(dbInfo, username, function(err, rows, fields){
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

if(removeSharableTesting){
	//Removing the first object in the DB
	sql_queries.removeSharable(dbInfo, 1, function(err, user){
		if(err){
			console.log("Error in test removeSharableTesting " + err);
		}
		console.log("Successfully removed " + shareable.shar_name);
	});
	

}


connection.end();