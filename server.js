var express = require('express')
  , hash = require('./pass').hash;
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var session = require('express-session')
var mysql = require('mysql');
var sqlQueries = require('./sql_queries');
var util = require('./util');

var app = express();

// ###############################
// # Middleware
// ###############################
app.use(bodyParser());
app.use(cookieParser('shhhh, very secret'));
app.use(session());

// Session-persisted message middleware

app.use(function(req, res, next){
  var err = req.session.error
    , msg = req.session.success;
  delete req.session.error;
  delete req.session.success;
  res.locals.message = '';
  if (err) res.locals.message = '<p class="msg error">' + err + '</p>';
  if (msg) res.locals.message = '<p class="msg success">' + msg + '</p>';
  next();
});

//sql connection info
var dbInfo = {
  host     : 'localhost',
  user     : 'ShareWhereUser',
  password : 'N3onIc3d',
  database : 'ShareWhereTest',
  dateStrings : true
}

 //Debug purposes
 //True means use the sql database
 //false means use the "database" created in code.
var use_sql_database = true;


// dummy database

var users = {
  tj: { name: 'tj' }
};

// when you create a user, generate a salt
// and hash the password ('foobar' is the pass here)

hash('foobar', function(err, salt, hash){
  if (err) throw err;
  // store the salt & hash in the "db"
  users.tj.salt = salt;
  users.tj.hash = hash.toString();
});

// Authenticate using our plain-object database of doom!
// Unless use_sql_database = true. Then you use local my_sql database.
function authenticate(name, pass, fn) {
  if (!module.parent) console.log('authenticating %s:%s', name, pass);
  if(use_sql_database){
    var userSelectStatement = "select * from users where username = '" + name+"'";
    var connection = mysql.createConnection(dbInfo);
	connection.query(userSelectStatement, function(err, rows, fields){
		if (err) throw err;
		if(rows.length <1){
			return fn(new Error('cannot find user'));
		}
		var user = rows[0];
		hash(pass, user.salt, function(err, hash){
			if (err) return fn(err);
			if (hash.toString('hex') == user.hash_code) return fn(null, user);
			fn(new Error('invalid password'));
	    })
	});
      connection.end();
  }
  else{
	  var user = users[name];
	  // query the db for the given username
	  if (!user) return fn(new Error('cannot find user'));
	  // apply the same algorithm to the POSTed password, applying
	  // the hash against the pass / salt, if there is a match we
	  // found the user
	  hash(pass, user.salt, function(err, hash){
		if (err) return fn(err);
		if (hash.toString() == user.hash) return fn(null, user);
		fn(new Error('invalid password'));
	  })
  }
}

function restrict(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    req.session.error = 'Access denied!';
    res.json({cookieValid : false});
  }
}

app.get('/', function(req, res){
  res.redirect('login');
});

app.get('/restricted', restrict, function(req, res){
  res.send('Wahoo! restricted area, click to <a href="/logout">logout</a>');
});

app.get('/cookiecheck', function(req, res) {
	if (req.session.user) {
		res.json({cookieValid : true});
  } else {
		res.json({cookieValid : false});
  }
})

//DEBUG
app.get('/sessionInfo', restrict, function(req,res){
   console.log(req.session.user);
   res.send('you made it to sessionInfo');
});

app.get('/logout', function(req, res){
  // destroy the user's session to log them out
  // will be re-created next request
  req.session.destroy(function(){
    res.redirect('/');
  });
});

app.get('/login', function(req, res){
  res.send('login');
});

//The username is stored in the session. It is accessible by res.session.user.name
app.post('/login', function(req, res){
  authenticate(req.body.username, req.body.password, function(err, user){
    if (user) {
      // Regenerate session when signing in
      // to prevent fixation
      req.session.regenerate(function(){
        // Store the user's primary key
        // in the session store to be retrieved,
        // or in this case the entire user object
        req.session.user = user;
        req.session.success = 'Authenticated as ' + user.name
          + ' click to <a href="/logout">logout</a>. '
          + ' You may now access <a href="/restricted">/restricted</a>.';
        res.json({success : 'true' })

      });
    } else {
      req.session.error = 'Authentication failed, please check your '
        + ' username and password.'
        + ' (use "tj" and "foobar")';
      res.json({success : 'false'})
    }
  });
});

app.get('/register', function(req, res){

});

app.post('/register', function(req, res){
  var user = {
    username : req.body.username,
    password : req.body.password,
    email_address : req.body.email_address,
	zip_code : req.body.zip_code
  };
  console.log("Attempting to add user: " + user.username)
  sqlQueries.addUser(dbInfo, user, function(err, rows, fields){
    if(err){
      console.log("Error trying to add user. " + err)
	  res.json({success: 'false', errorMessage: 'User already exists'});
	  return;
    }
    req.session.regenerate(function(){
      req.session.user = user
      req.session.success = 'Authenticated as ' + user.username
          + ' click to <a href="/logout">logout</a>. '
          + ' You may now access <a href="/restricted">/restricted</a>.';
      console.log("Success in adding user " + user.username)
      res.json({success: 'true'})
    });

  });

});

app.get('/browseoffers', function(req, res){
  console.log("Attempting to get all offered Shareables");
  sqlQueries.getAllOfferedShareables(dbInfo, function(err, offeredShareables){
    if(err){
		console.log(err);
		res.json({success : false, error_message : "error in browseoffers : "+err})
    }
    res.json({success : true, offers : offeredShareables})
  });
});

app.get('/browserequests', function(req, res){
  console.log("Attempting to get all reqested Shareables");
  sqlQueries.getAllRequestedShareables(dbInfo, function(err, requestedShareables){
    if(err){
		console.log(err);
		res.json({success : false, error_message : "error in browserequests : "+err})
    }
    res.json({success : true, requests : requestedShareables})
  });
});

app.get('/requests', function(req,res) {
  console.log("Attempting to get all offer type shareables the user is involved with");
  sqlQueries.getUsersRequests(dbInfo, req.query.username, function(err, usersRequests){
    if(err) {
		console.log(err);
		res.json({success : false, error_message : "error in requests : "+err})
	}
    res.json({userRequests : usersRequests});
  });
});

app.get('/offers', function(req, res) {
  console.log("Attempting to get all offer type shareables the user is involved with");
  sqlQueries.getUsersOffers(dbInfo, req.query.username, function(err, usersOffers){
    if(err) {
		console.log(err);
		res.json({success : false, error_message : "error in offers : "+err})
	}
    res.json({userOffers : usersOffers});
  });
});

app.post('/makeshareablerequest', function(req, res) {
	//
	// debug code
	console.log('Attempting to make a shareable request.');
	//
	if(!req.body.shar_name) {
		res.json({
			sucess : false,
			error_message : "shar_name not set."
		})
		return;
	}
	if(!req.body.username) {
		res.json({
			sucess : false,
			error_message : "Username not set, this is for testing. Usually username will be obtained through session."
		})
		return;
	}
	var shareableDescription;
	if(!req.body.description) {
		shareableDescription = "";
	}
	else {
		shareableDescription = req.body.description;
	}
	
	shareable = {
		shar_name: req.body.shar_name,
		state_name: "requesting",
		description: shareableDescription
	};
	uploadingUser = {
		username: req.body.username
	};
	sqlQueries.apiAddShareable(dbInfo, shareable, uploadingUser,  function(err, shareable, fields){
		if(err){
			res.json({
				sucess : false,
				error_message : "error in route makeshareablerequest: "+err
			})
			return;
		}
		res.json({
			success : true,
			shareable_added : shareable
		});
		return;
	});
});

app.post('/makeshareableoffer', function(req, res) {
	//
	// debug code
	console.log('Attempting to make a shareable request.');
	//
	if(!req.body.shar_name) {
		res.json({
			sucess : false,
			error_message : "shar_name not set."
		})
		return;
	}
	if(!req.body.username) {
		res.json({
			sucess : false,
			error_message : "Username not set, this is for testing. Usually username will be obtained through session."
		})
		return;
	}
	var shareableDescription;
	if(!req.body.description) {
		shareableDescription = "";
	}
	else {
		shareableDescription = req.body.description;
	}
	
	shareable = {
		shar_name: req.body.shar_name,
		state_name: "offering",
		description: shareableDescription
	};
	uploadingUser = {
		username: req.body.username
	};
	sqlQueries.apiAddShareable(dbInfo, shareable, uploadingUser,  function(err, shareable, fields){
		if(err){
			res.json({
				sucess : false,
				error_message : "error in route makeshareablerequest: "+err
			})
			return;
		}
		res.json({
			success : true,
			shareable_added : shareable
		});
		return;
	});
});

// ###############################
// # Startup
// ###############################
util.printLogo()

var portNumber = util.getSuitablePort();
app.listen(portNumber);
console.log('ShareWhere server started on port ' + portNumber);
