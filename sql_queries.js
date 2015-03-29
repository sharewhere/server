var hash = require('./pass').hash;
var mysql      = require('mysql');

getEntityByPrimaryKey = function(dbInfo, entityTable, primaryKey, primaryValue, fn){
	if(!primaryValue){
		throw new Error("No primaryValue set in getEntityByPrimaryKey");
	}
	var queryString = "select * from "+entityTable+" where "+primaryKey+" ='"+primaryValue+"';";
	
	conn = mysql.createConnection(dbInfo);
	conn.query(queryString, function(err, rows, fields){
		if (err) throw err;
		if(rows.length <1){
			fn(new Error('cannot find entity in: '+entityTable));
		}
		var entity = rows[0];
		fn(err, entity);
	});
	conn.end();
}
//removeEntityByPrimaryKey(dbInfo, "shareables", "shar_id", shar_id, function(err, user)
removeEntityByPrimaryKey = function(dbInfo, entityTable, primaryKey, primaryValue, fn){
	if(!primaryValue){
		throw new Error("No primaryValue set in removeEntityByPrimaryKey.");
	}
	var queryString = "delete from "+entityTable+" where "+primaryKey+" ="+primaryValue+";";
	conn = mysql.createConnection(dbInfo);
	conn.query(queryString, function(err){
		if (err) throw err;
	});
	conn.end();
}


module.exports={
	//User must have username, password, and email_address defined for addition to database.
	addUser: function(dbInfo, user, fn)
	{
		if(!user.username){
			throw new Error("no username set in addUser");
		}
		if(!user.password){
			throw new Error("no password set in addUser");
		}
		if(!user.email_address){
			throw new Error("no email address set in addUser");
		}
		
		hash(user.password, '12345678901234567890', function(err, hash){
			if(err) throw(err);
			user.salt = '12345678901234567890';
			user.hash_code = hash.toString('hex');
			
			
			var queryString = "INSERT INTO users (username, salt, hash_code, activation_date, last_login, rank_id, email_address";
			if(user.zip_code){
				queryString = queryString + ', zip_code';
			}
			queryString = queryString +") VALUES ('"+user.username +"', '" +user.salt +"', '" +user.hash_code +"', CURDATE(), CURDATE(), (SELECT rank_id FROM ranks WHERE rank_title = 'Newbie'), '"+user.email_address;
			if(user.zip_code){
				queryString = queryString +"', '"+user.zip_code;
			}
			queryString = queryString +"');";
			console.log("addUser queryString: "+queryString);
			
			conn = mysql.createConnection(dbInfo);
			conn.query(queryString, function(err, rows, fields){
				fn(err, rows, fields);
			});
			conn.end();
		});
	},
	
	removeUser: function(dbInfo, username, fn){
		if(!username){
			throw new Error("no username set in removeUser");
		}
		queryString = "delete from users where username = '"+username+"';";
		
		conn = mysql.createConnection(dbInfo);
		conn.query(queryString, function(err, rows, fields){
			fn(err, rows, fields);
		});
		conn.end();
	},
	
	getUser: function(dbInfo, username, fn){
		getEntityByPrimaryKey(dbInfo,"users", "username", username, function(err, user){
			fn(err, user);
		});
	},
	
	//This function could be reasonably reimplemented to
	//have a callback function: function(err, shareables) 
	getUsersShareables: function(dbInfo, username, fn){
		if(!username){
			throw new Error("no username set in getUserShareables");
		}
		queryString = "select * from shareables where username = '"+username+"';";
		
		conn = mysql.createConnection(dbInfo);
		conn.query(queryString, function(err, rows, fields){
			fn(err, rows, fields);
		});
		conn.end();
	},
	
	getUsersRequests: function(dbInfo, username, fn){
		if(!username){
			throw new Error("no username set in getUserShareables");
		}
		
		var queryString = "select distinct \
								shareables.shar_id, username, shar_name, description, state_name, creation_date, lender, borrower \
								from shareables \
								left outer join transactions \
								on transactions.shar_id=shareables.shar_id \
								and shareables.shar_id = transactions.shar_id \
								inner join shareable_states \
								on shareables.state_id = shareable_states.state_id \
								where shareables.state_id in (select state_id from shareable_states where (shareables.username = '"+username+"' and(state_name = 'requesting' or state_name='requested_received_offer')) or (state_name = 'offered_received_request' and transactions.borrower = '"+username+"'));";
		conn = mysql.createConnection(dbInfo);
		conn.query(queryString, function(err, rows, fields){
			fn(err, rows);
		});
		conn.end();
	},

	getUsersOffers: function(dbInfo, username, fn){
		if(!username){
			throw new Error("no username set in getUserShareables");
		}
		var queryString = "select distinct \
								shareables.shar_id, username, shar_name, description, state_name, creation_date, lender, borrower \
								from shareables \
								left outer join transactions \
								on transactions.shar_id=shareables.shar_id \
								and shareables.shar_id = transactions.shar_id \
								inner join shareable_states \
								on shareables.state_id = shareable_states.state_id \
								where shareables.state_id in (select state_id from shareable_states where (shareables.username = '"+username+"' and(state_name = 'offering' or state_name='offered_received_request')) or (state_name = 'requested_received_offer' and transactions.lender = '"+username+"'));";
		conn = mysql.createConnection(dbInfo);
		conn.query(queryString, function(err, rows, fields){
			fn(err, rows);
		});
		conn.end();
	},
	
	//User must have username defined.
	//The shareable that is being added is added for that user.
	addShareable: function(dbInfo, shareable, user, fn){
		if(!shareable.shar_name){
			throw new Error("No shar_name set in addShareable");
		}
		if(!shareable.shareableState){
			throw new Error("No shareableState set in addShareable");
		}
		if(!user.username){
			throw new Error("No username set in addShareable");
		}
		if(!shareable.description){
			shareable.description = '';
		}
		queryString = "insert into shareables(shar_name, description, username, state_id) VALUES ('";
		queryString = queryString + shareable.shar_name +"', '"+shareable.description+"','"+user.username
			+"',(select state_id from shareable_states where state_name = '"+shareable.shareableState+"'));";
		
		conn = mysql.createConnection(dbInfo);
		conn.query(queryString, function(err, rows, fields){
			fn(err, rows, fields);
		});
		conn.end();
	},
	
	//Can't use getEntityByPrimaryKey because it needs to join on shareable_state
	getShareable: function(dbInfo, shar_id, fn){
		if(!shar_id){
			throw new Error("No shar_id set in getShareable");
		}
		var queryString = "select * from shareables inner join shareable_states on "
		+ "shareables.state_id = shareable_states.state_id where shar_id ='"+shar_id+"';";
		
		conn = mysql.createConnection(dbInfo);
		conn.query(queryString, function(err, rows, fields){
			if (err) throw err;
			if(rows.length <1){
				fn(new Error("cannot find shareable"));
			}
			var shareable = rows[0];
			fn(err, shareable);
		});
		conn.end();
	},

	removeShareable :function(dbInfo, shar_id, fn){
		removeEntityByPrimaryKey(dbInfo, "shareables", "shar_id", shar_id, function(err, user){
			fn(err, user);
		});
	},
	
	offerOnRequest: function(dbInfo, shar_id, username){
		//The shareable has to be in requesting or requested_received_offer
		//The user must be authenticated and have username defined
		//Shareable is distinguished by its shar_id field
		//The offer must be logged in the database so there is an association
		//Between the user requesting, the user offering, and the shareable
		//This is a transaction of type offer
		if(!shar_id){
			throw new Error("Shareable doesn't have shar_id set in offerOnRequest");
		}
		module.exports.getShareable(dbInfo, shar_id, function(err, shareable){
			if(err){
				throw err;
			}
			var allowableStates = ["requesting", "requested_received_offer"];
			if(!(allowableStates.indexOf(shareable.state_name) > -1)){
				//Shareable is not in proper state for offering.
				throw new Error("Shareable can't be offered in this state");
			}
			queryString = "UPDATE shareables SET state_id = "+
			"(select state_id from shareable_states where state_name = 'requested_received_offer') where shar_id = '"
			+shar_id+"';";
			
			conn = mysql.createConnection(dbInfo);
			conn.query(queryString, function(err, rows, fields){
				if (err) throw err;
			});
			conn.end();
		});
	},

	requestOnOffer: function(dbInfo, shar_id, username){
		if(!shar_id){
			throw new Error("Shareable doesn't have shar_id set in requestOnOffer");
		}
		module.exports.getShareable(dbInfo, shar_id, function(err, shareable){
			if(err){
				throw err;
			}
			var allowableStates = ["offering", "offered_received_request"];
			if(!(allowableStates.indexOf(shareable.state_name) > -1)){
				throw new Error("shareable can't be offered in this state.");
			}
			queryString = "UPDATE shareables SET state_id = "+
			"(select state_id from shareable_states where state_name = 'offered_received_request') where shar_id = '"
			+shar_id+"';";

			conn = mysql.createConnection(dbInfo);
			conn.query(queryString, function(err, rows, fields){
				if (err) throw err;
			});
			conn.end();
		});
	},

	makeShareableHidden: function(dbInfo, shar_id, username){
		if(!shar_id){
			throw new Error("Shareable doesn't have shar_id set in makeShareableHidden");
		}
		module.exports.getShareable(dbInfo, shar_id, function(err, shareable){
			if(err) throw err;
			var allowableStates = ["reserved", "requesting", "offering", "requested_received_offer", "offered_received_request", "returned"];
			if(!(allowableStates.indexOf(shareable.state_name) > -1)){
				throw new Error("shareable can't be offered in this state.");
			}
			queryString = "UPDATE shareables SET state_id = "+
			"(select state_id from shareable_states where state_name = 'hidden') where shar_id = '"
			+shar_id+"';";

			conn = mysql.createConnection(dbInfo);
			conn.query(queryString, function(err, rows, fields){
				if (err) throw err;
			});
			conn.end();
		});
	},

	getAllOfferedShareables: function(dbInfo, fn){
		queryString = "SELECT * from shareables inner join shareable_states on shareables.state_id = shareable_states.state_id where state_name = 'offering' or state_name = 'offered_received_request'";
		conn = mysql.createConnection(dbInfo);
		conn.query(queryString, function(err, rows, fields){
			if(err) throw err;
			fn(err, rows);
		});
		conn.end();
	},

	getAllRequestedShareables: function(dbInfo, fn){
		queryString = "SELECT * from shareables inner join shareable_states on shareables.state_id = shareable_states.state_id where state_name = 'requesting' or state_name = 'requested_received_offer'";
		conn = mysql.createConnection(dbInfo);
		conn.query(queryString, function(err, rows, field){
			if(err) throw err;
			fn(err, rows);
		});
		conn.end();
	}

};