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
	
	addShareable: function(conn, shareable, fn)
	{
		
	}
}