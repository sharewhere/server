var mysql      = require('mysql');
var sql_queries = require('./sql_queries');
var dbInfo = {
  host     : 'localhost',
  user     : 'ShareWhereUser',
  password : 'N3onIc3d',
  database : 'ShareWhereTest'
};
var connection = mysql.createConnection(dbInfo);

var connectionTesting = false;
var addUserTesting = false;
var removeUserTesting = false;
var getUserTesting = false;
var getUsersShareablesTesting = false;
var addShareableTesting = false;
var getShareableTesting = false;
var offerOnRequestTesting = false;
var removeSharableTesting = false;
var requestOnOfferTesting = false;
var makeShareableHiddenTest = false;
var getUsersRequestsTesting = false;
var getAllOfferedShareablesTest = false;
var getAllRequestedShareablesTest = false;
var getUsersOffersTest = false;

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

if(getShareableTesting){
	console.log("Attempting to get the with shar_id 1");
	sql_queries.getShareable(dbInfo, 1, function(err, shareable){
		if(err){
			console.log("error in test removeUser: "+err);
		}
		console.log("Retrieved shareable: %j", shareable)
	});
}

if(offerOnRequestTesting){
	var shar_id = 1;
	sql_queries.getShareable(dbInfo, 1, function(err, shareable){
		if(err){
				console.log("error in test offerOnRequestTesting: "+err);
			}
			console.log("Shareable with shar_id = 1 before \"offerOnRequest\"\n %j", shareable)
		});
	sql_queries.offerOnRequest(dbInfo, shar_id);
	sql_queries.getShareable(dbInfo, 1, function(err, shareable){
		if(err){
				console.log("error in test offerOnRequestTesting: "+err);
			}
			console.log("\nShareable with shar_id = 1 after \"offerOnRequest\"\n %j", shareable)
		});
}

if(requestOnOfferTesting){
	var shar_id = 2;
	sql_queries.getShareable(dbInfo, 2, function(err, shareable){
		if(err){
				console.log("error in test requestOnOfferTesting: "+err);
			}
		console.log("Shareable with shar_id = 2 before \"requestOnOffer\"\n %j", shareable)
			
		});
	sql_queries.requestOnOffer(dbInfo, shar_id);
	sql_queries.getShareable(dbInfo, 2, function(err, shareable){
		if(err){
				console.log("error in test requestOnOfferTesting: "+err);
			}
		console.log("\nShareable with shar_id = 2 after \"requestOnOffer\"\n %j", shareable)
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

if(makeShareableHiddenTest){
	var shar_id = 1;
	sql_queries.getShareable(dbInfo, 1, function(err, shareable){
		if(err){
			console.log("Error in test makeShareableHiddenTest " + err);
		}
		console.log("Shareable with shar_id = 1 before \"makeShareableHidden\"\n %j", shareable)
	});
	sql_queries.makeShareableHidden(dbInfo, shar_id);
	sql_queries.getShareable(dbInfo, 1, function(err, shareable){
		if(err){
			console.log("Error in test makeShareableHiddenTest " + err);
		}
		console.log("Shareable with shar_id = 1 after \"makeShareableHidden\"\n %j", shareable)
	});
}
if(getAllOfferedShareablesTest){
	sql_queries.getAllOfferedShareables(dbInfo, function(err, offeredShareables){
		if(err){
			console.log("Error in getOfferedShareablesTest. " + err);
		}
	console.log("offeredShareables : %j", offeredShareables);
	});
}

if(getUsersRequestsTesting){
	//Removing the first object in the DB
	sql_queries.getUsersRequests(dbInfo, 'tj', function(err, requests){
		if(err){
			console.log("Error in test getUsersRequestsTesting " + err);
		}
		console.log("All of the user TJ's requests: %j", requests);
	});

}

if(getUsersOffersTest){
	//Removing the first object in the DB
	sql_queries.getUsersOffers(dbInfo, 'jeff', function(err, offers){
		if(err){
			console.log("Error in test getUsersOffersTest " + err);
		}
		console.log("%j", offers);
	});

}

if(getAllRequestedShareablesTest){
	//Removing the first object in the DB
	sql_queries.getAllRequestedShareables(dbInfo, function(err, requestedShareables){
		if(err){
			console.log("Error in test getAllRequestedShareablesTest " + err);
		}
		console.log("%j", requestedShareables);
	});

}
connection.end();
