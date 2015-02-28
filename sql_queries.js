var hash = require('./pass').hash;
var mysql      = require('mysql');

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
				queryString = queryString +", "+user.zip_code;
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
		if(!username) throw new Error("no username set in removeUser");
		queryString = "delete from users where username = '"+username+"';";
		
		conn = mysql.createConnection(dbInfo);
		conn.query(queryString, function(err, rows, fields){
			fn(err, rows, fields);
		});
		conn.end();
	},
	
	getUser: function(dbInfo, username, fn){
		if(!username){
			throw new Error("No username set in getUser");
		}
		var queryString = "select * from users where username ='"+username+"';";
		
		conn = mysql.createConnection(dbInfo);
		conn.query(queryString, function(err, rows, fields){
			if (err) throw err;
			if(rows.length <1){
				fn(new Error('cannot find user'));
			}
			var user = rows[0];
			fn(err, user);
		});
		conn.end();
	},
	
	//This function could be reasonably reimplemented to
	//have a callback function: function(err, shareables) 
	getUsersShareables: function(dbInfo, username, fn){
		if(!username) throw new Error("no username set in getUserShareables");
		queryString = "select * from shareables where username = '"+username+"';";
		
		conn = mysql.createConnection(dbInfo);
		conn.query(queryString, function(err, rows, fields){
			fn(err, rows, fields);
		});
		conn.end();
	},
	
	//User must have username defined.
	//The shareable that is being added is added for that user.
	addShareable: function(dbInfo, shareable, user, fn)
	{
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
	
	offerOnRequest: function(dbInfo, shareable, user, fn){
		//The shareable has to be in requesting or requested_received_offer
		//The user must be authenticated and have username defined
		//Shareable is distinguished by its shar_id field
		if(shareable.shar_id){
			throw new Error("Shareable doesn't have shar_id set in offerOnRequest");
		}
	}
};