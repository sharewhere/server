var hash = require('./pass').hash;
var mysql = require('mysql');

getEntityByPrimaryKey = function(dbInfo, entityTable, primaryKey, primaryValue, fn){
	if(!primaryValue){
		fn(new Error("No primaryValue set in getEntityByPrimaryKey"));
	}
	var queryString = "select * from "+entityTable+" where "+primaryKey+" ='"+primaryValue+"';";
	
	var conn = mysql.createConnection(dbInfo);
	conn.query(queryString, function(err, rows, fields){
		if (err) fn(err);
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
		fn(new Error("No primaryValue set in removeEntityByPrimaryKey."));
	}
	var queryString = "delete from "+entityTable+" where "+primaryKey+" ="+primaryValue+";";
	var conn = mysql.createConnection(dbInfo);
	conn.query(queryString, function(err){
		if (err) fn(err);
	});
	conn.end();
}


module.exports={
	//User must have username, password, and email_address defined for addition to database.
	addUser: function(dbInfo, user, fn)
	{
		if(!user.username){
			fn(new Error("no username set in addUser"));
		}
		if(!user.password){
			fn(new Error("no password set in addUser"));
		}
		if(!user.email_address){
			fn(new Error("no email address set in addUser"));
		}
		
		hash(user.password, '12345678901234567890', function(err, hash){
			if(err) fn(err);
			user.salt = '12345678901234567890';
			user.hash_code = hash.toString('hex');
			
			
			var queryString = "INSERT INTO users (username, salt, hash_code, activation_date, last_login, email_address";
			if(user.zip_code){
				queryString = queryString + ', zip_code';
			}
			queryString = queryString +") VALUES ('"+user.username +"', '" +user.salt +"', '" +user.hash_code +"', CURDATE(), CURDATE(), '"+user.email_address;
			if(user.zip_code){
				queryString = queryString +"', '"+user.zip_code;
			}
			queryString = queryString +"');";
			
			var conn = mysql.createConnection(dbInfo);
			conn.query(queryString, function(err, rows, fields){
				fn(err, rows, fields);
			});
			conn.end();
		});
	},
	
	removeUser: function(dbInfo, username, fn){
		if(!username){
			fn(new Error("no username set in removeUser"));
		}
		queryString = "delete from users where username = '"+username+"';";
		
		var conn= mysql.createConnection(dbInfo);
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
			fn(new Error("no username set in getUserShareables"));
		}
		queryString = "select * from shareables where username = '"+username+"';";
		
		var conn= mysql.createConnection(dbInfo);
		conn.query(queryString, function(err, rows, fields){
			fn(err, rows, fields);
		});
		conn.end();
	},
	
	getUsersRequests: function(dbInfo, username, fn){
		if(!username){
			fn(new Error("no username set in getUserShareables"));
		}
		
		var queryString = "select distinct shareables.shar_id, username, shar_name, description, state_name, creation_date, b.responses from shareables left outer join ( select shar_id, lender, borrower, count(borrower) as responses from transactions group by transactions.shar_id)"+
		"as b on b.shar_id=shareables.shar_id inner join shareable_states on shareables.state_id = shareable_states.state_id where shareables.state_id in (select state_id from shareable_states where (shareables.username = '"+username+"' and(state_name = 'requesting' or state_name='requested_received_offer'))"+
		"or (state_name = 'offered_received_request' and b.borrower = '"+username+"'));";
		var conn= mysql.createConnection(dbInfo);
		conn.query(queryString, function(err, rows, fields){
            fn(err, rows);
		});
        conn.end();
	},

	getUsersOffers: function(dbInfo, username, fn){
		if(!username){
			fn(new Error("no username set in getUserShareables"));
		}
		var queryString = "select distinct shareables.shar_id, username, shar_name, description, state_name, creation_date, b.responses from shareables left outer join ( select shar_id, lender, borrower, count(borrower) as responses from transactions group by transactions.shar_id)"+
		"as b on b.shar_id=shareables.shar_id inner join shareable_states on shareables.state_id = shareable_states.state_id where shareables.state_id in (select state_id from shareable_states where (shareables.username = '"+username+"' and(state_name = 'offering' or state_name='offered_received_request'))"+
		"or (state_name = 'requested_received_offer' and b.lender = '"+username+"'));";
		var conn= mysql.createConnection(dbInfo);
		conn.query(queryString, function(err, rows, fields){
			fn(err, rows);
		});
		conn.end();
	},
	
	//User must have username defined.
	//The shareable that is being added is added for that user.
	addShareable: function(dbInfo, shareable, user, fn){
		if(!shareable.shar_name){
			fn("No shar_name set in addShareable");
			return;
		}
		if(!shareable.state_name){
			fn("No shareableState set in addShareable");
			return;
		}
		var allowableStates = ["requesting", "offering"];
		if(!(allowableStates.indexOf(shareable.state_name) > -1)) {
			fn("Shareable state is not one of the allowed states for creating a shareable.");
			return;
		}
		if(!user.username){
			fn("No username set in addShareable");
			return;
		}
		if(!shareable.description){
			shareable.description = '';
		}
        if(shareable.hasOwnProperty('shar_pic_name') && shareable.shar_pic_name != null){
           shareable.shar_pic_name = "'"+shareable.shar_pic_name+"'"; 
        }
        else{
           shareable.shar_pic_name = "null";
        }
        if(shareable.hasOwnProperty('start_date') && shareable.start_date != null){
           shareable.start_date = "'"+shareable.start_date+"'"; 
        }
        else{
           shareable.start_date = "null";
        }
        if(shareable.hasOwnProperty('end_date') && shareable.end_date != null){
           shareable.end_date = "'"+shareable.end_date+"'"; 
        }
        else{
           shareable.end_date = "null";
        }
		var queryString = "insert into shareables(shar_name, description, username, state_id, shar_pic_name, start_date, end_date) VALUES ('";
		queryString = queryString + shareable.shar_name +"', '"+shareable.description+"','"+user.username
			+"',(select state_id from shareable_states where state_name = '"+shareable.state_name+"'), "+shareable.shar_pic_name+", "+shareable.start_date+", "+shareable.end_date+");";
		
		var conn= mysql.createConnection(dbInfo);
		conn.query(queryString, function(err, rows, fields){
			fn(err, rows, fields);
		});
		conn.end();
	},
	
	apiAddShareable: function(dbInfo, shareable, user, fn) {
		module.exports.addShareable(dbInfo, shareable, user, function(err, rows, fields) {
			if(err) {
				fn(err);
				return;
			}
			if(!rows.insertId) {
				fn(new Error("insertId not obtained in apiAddShareable."));
				return;
			}
			module.exports.getShareable(dbInfo, rows.insertId, function(err2, rows2) {
				fn(err2, rows2);
			});
		});
	},
	
	//Can't use getEntityByPrimaryKey because it needs to join on shareable_state
	getShareable: function(dbInfo, shar_id, fn){
		if(!shar_id){
			fn(new Error("No shar_id set in getShareable"));
		}
		var queryString = "select shareables.*, shareable_states.state_name, zip_code from shareables inner join shareable_states on shareables.state_id = shareable_states.state_id inner join users on shareables.username = users.username where shar_id ='"+shar_id+"';";
		
		var conn= mysql.createConnection(dbInfo);
		conn.query(queryString, function(err, rows, fields){
			if (err) fn(err);
			if(rows.length <1){
				fn(new Error("cannot find shareable"));
			}
			var shareable = rows[0];
			fn(err, shareable);
		});
		conn.end();
	},
	
	getReqOffTransMine : function(dbInfo, shar_id, fn) {
		if(!shar_id){
			fn(new Error("No shar_id set in getReqOffTransMine"));
			return;
		}
		
		var queryString = "select * from transactions where transactions.shar_id = '"+shar_id+"';";
		
		var conn= mysql.createConnection(dbInfo);
		conn.query(queryString, function(err, rows, fields){
			if (err) {
				fn(err);
				return;
			}			
			fn(err, rows);
		});
		conn.end();
	},

	//The username is the person trying to view the reqoffshareable.
	getReqOffTransOther : function(dbInfo, shar_id, username, fn) {
		if(!shar_id){
			fn(new Error("No shar_id set in getReqOffTransOther"));
			return;
		}
		if(!username){
			fn(new Error("No shar_id set in getReqOffTransOther"));
			return;
		}
		var queryString = "select * from transactions where shar_id = '"+shar_id+"' and (lender = '"+username+"' or borrower = '"+username+"');";
		
		var conn= mysql.createConnection(dbInfo);
		conn.query(queryString, function(err, row, fields){
			if (err) {
				fn(err);
				return;
			}			
			fn(err, row);
		});
		conn.end();		
	},
	
	apiGetReqOffShareable : function(dbInfo, shar_id, username, fn) {
		if(!shar_id){
			fn(new Error("No shar_id set in apiGetReqOffShareable"));
			return;
		}
		if(!username){
			fn(new Error("No shar_id set in apiGetReqOffShareable"));
			return;
		}
		
		module.exports.getShareable(dbInfo, shar_id, function(err, shareable) {
				if(shareable.username == username) {
					module.exports.getReqOffTransMine(dbInfo, shar_id, function(err, transactions) {
						if(err) {
							fn(err);
							return;
						}
						fn(err, shareable, transactions);
					});
				}
				else {
					module.exports.getReqOffTransOther(dbInfo, shar_id, username, function(err, transaction) {
						if(err) {
							fn(err);
							return;
						}
						fn(err, shareable, transaction);
					})
				}
		});
	},
	
	removeShareable :function(dbInfo, shar_id, fn){
		removeEntityByPrimaryKey(dbInfo, "shareables", "shar_id", shar_id, function(err, user){
			fn(err, user);
		});
	},
	
	//TODO whenever this is done it should also insert a row into the transactions table to log the request.
	offerOnRequest: function(dbInfo, shar_id, username, fn){
		//The shareable has to be in requesting or requested_received_offer
		//The user must be authenticated and have username defined
		//Shareable is distinguished by its shar_id field
		//The offer must be logged in the database so there is an association
		//Between the user requesting, the user offering, and the shareable
		//This is a transaction of type offer
		if(!shar_id){
			fn(new Error("Shareable doesn't have shar_id set in offerOnRequest"));
		}
		module.exports.getShareable(dbInfo, shar_id, function(err, shareable){
			if(err){
				fn(err);
			}
			var allowableStates = ["requesting", "requested_received_offer"];
			if(!(allowableStates.indexOf(shareable.state_name) > -1)){
				//Shareable is not in proper state for offering.
				fn(new Error("Shareable can't be offered in this state: "+shareable.state_name));
			}
			var queryString1 = "UPDATE shareables SET state_id = \
			(select state_id from shareable_states where state_name = 'requested_received_offer') where shar_id = '"
			+shar_id+"';"
			var queryString2 = "INSERT INTO transactions \
				(lender, borrower, shar_id, type_id) \
			values \
				('"+username+"', (select username from shareables where shar_id = "+shar_id+"), '"+shar_id+"', (select type_id from transaction_types where type_name = 'request/offer'));";
			
			var conn= mysql.createConnection(dbInfo);
			conn.query(queryString1, function(err, rows, fields){
				if (err) fn(err);
			});
            conn.query(queryString2, function(err, rows, fields){
                if(err) fn(err); 
                fn(err, rows, fields);
            });
			conn.end();
		});
	},

	//TODO whenever this is done it should also insert a row into the transactions table to log the request.
	requestOnOffer: function(dbInfo, shar_id, username, fn){
		if(!shar_id){
			fn(new Error("Shareable doesn't have shar_id set in requestOnOffer"));
		}
		module.exports.getShareable(dbInfo, shar_id, function(err, shareable){
			if(err){
				fn(err);
			}
			var allowableStates = ["offering", "offered_received_request"];
			if(!(allowableStates.indexOf(shareable.state_name) > -1)){
				fn(new Error("shareable can't be requested in this state: "+shareable.state_name));
			}
			var queryString1 = "UPDATE shareables SET state_id = "+
			"(select state_id from shareable_states where state_name = 'offered_received_request') where shar_id = '"
			+shar_id+"';";
			var queryString2 = "INSERT INTO transactions \
				(lender, borrower, shar_id, type_id) \
			values \
				((select username from shareables where shar_id = "+shar_id+"), '"+username+"', '"+shar_id+"', (select type_id from transaction_types where type_name = 'request/offer'));";

			var conn= mysql.createConnection(dbInfo);
			conn.query(queryString1, function(err, rows, fields){
				if (err) fn(err);
			});
            conn.query(queryString2, function(err, rows, fields){
                if(err) fn(err); 
                fn(err, rows, fields);
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
			var queryString = "UPDATE shareables SET state_id = "+
			"(select state_id from shareable_states where state_name = 'hidden') where shar_id = '"
			+shar_id+"';";

			var conn= mysql.createConnection(dbInfo);
			conn.query(queryString, function(err, rows, fields){
				if (err) throw err;
			});
			conn.end();
		});
	},

	getAllOfferedShareables: function(dbInfo, fn){
		var queryString = "SELECT shareables.*, state_name, zip_code from shareables inner join shareable_states on shareables.state_id = shareable_states.state_id inner join users on shareables.username = users.username where state_name = 'offering' or state_name = 'offered_received_request' order by shareables.creation_date desc";
		var conn= mysql.createConnection(dbInfo);
		conn.query(queryString, function(err, rows, fields){
			if(err) fn(err);
			fn(err, rows);
		});
		conn.end();
	},

	getAllRequestedShareables: function(dbInfo, fn){
		var queryString = "SELECT shareables.*, state_name, zip_code from shareables inner join shareable_states on shareables.state_id = shareable_states.state_id inner join users on shareables.username = users.username where state_name = 'requesting' or state_name = 'requested_received_offer' order by shareables.creation_date desc";
		var conn= mysql.createConnection(dbInfo);
		conn.query(queryString, function(err, rows, field){
			if(err) fn(err);
			fn(err, rows);
		});
		conn.end();
	},


	makeShareableDeleted: function(dbInfo, shar_id, fn){
		var queryString = "UPDATE shareables SET state_id = "+
		"(select state_id from shareable_states where state_name = 'deleted') WHERE shar_id = '"+shar_id+"';";
		var conn= mysql.createConnection(dbInfo);
		conn.query(queryString, function(err, rows){
			if(err) fn(err);
			fn(err, rows);
		});
		conn.end();
	}, 

	getSearchedOffers: function(dbInfo, searchValue, fn){
		var queryString = "SELECT shareables.*, state_name, zip_code FROM shareables INNER JOIN users ON shareables.username = users.username INNER JOIN shareable_states ON shareables.state_id = shareable_states.state_id WHERE ((state_name = 'offering' OR state_name = 'offered_received_request') AND (shar_name LIKE '%"+searchValue+"%'  OR description LIKE '%"+searchValue+"%'))";
		var conn= mysql.createConnection(dbInfo);
		conn.query(queryString, function(err, rows){
			if(err) fn(err);
			fn(err, rows);
		});
		conn.end();
	},

	getSearchedRequests: function(dbInfo, searchValue, fn){
		var queryString = "SELECT shareables.*, state_name, zip_code FROM shareables INNER JOIN users ON shareables.username = users.username INNER JOIN shareable_states ON shareables.state_id = shareable_states.state_id WHERE ((state_name = 'requesting' OR state_name = 'requested_received_offer') AND (shar_name LIKE '%"+searchValue+"%'  OR description LIKE '%"+searchValue+"%'))";
		var conn= mysql.createConnection(dbInfo);
		conn.query(queryString, function(err, rows){
			if(err) fn(err);
			fn(err, rows);
		});
		conn.end();
	},

	//Make new transaction for shareable between users, mark it completed
	//Add points to users in transaction
	//Make shareable now hidden

	completeShareable: function(dbInfo, transID, fn){

		//console.log("transID : "+transID);
		var queryString1 = "update users set points = points+1 where username = (select point_recipient from ((select lender as point_recipient from transactions b where trans_id = '"+transID+"') UNION (select borrower as point_recipient from transactions c where trans_id = '"+transID+"')) lender_borrower_union WHERE point_recipient != (select sh.username from shareables sh inner join transactions tr on sh.shar_id = tr.shar_id WHERE tr.trans_id = '"+transID+"'));";
		var queryString2 = "update transactions set type_id = (select type_id from transaction_types where type_name = 'completed') WHERE trans_id = '"+transID+"';";
		var queryString3 = "DELETE FROM transactions WHERE shar_id = (select shar_id from (select tr.shar_id from transactions tr where tr.trans_id = '"+transID+"') as temp_table) AND type_id = (select type_id from transaction_types where type_name = 'request/offer');";
		var queryString4 = "update shareables set state_id = (select state_id from shareable_states where state_name = 'hidden') WHERE shar_id = (select shar_id from transactions where trans_id = '"+transID+"');";

		var conn= mysql.createConnection(dbInfo);
		conn.query(queryString1, function(err){
			if(err)
				fn(err);
		});
		conn.query(queryString2, function(err){
			if(err)
				fn(err);
		});
		conn.query(queryString3, function(err){
			if(err)
				fn(err);
		});
		conn.query(queryString4, function(err){
			if(err)
				fn(err);
			fn(err);
		});
		conn.end();
	}
	
};
