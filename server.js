var express = require('express')
  , hash = require('./pass').hash;
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var session = require('express-session')
var mysql = require('mysql');
var sqlQueries = require('./sql_queries');

var app = express();

var portNumber = 8000;

// middleware

//app.use(express.bodyParser());
//app.use(express.cookieParser('shhhh, very secret'));
//app.use(express.session());
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
  database : 'ShareWhereTest'
}

var connection = mysql.createConnection(dbInfo);

//connect to the database
connection.connect();

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
    res.redirect('/login');
  }
}

app.get('/', function(req, res){
  res.redirect('login');
});

app.get('/restricted', restrict, function(req, res){
  res.send('Wahoo! restricted area, click to <a href="/logout">logout</a>');
});

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
      throw new Error("Error trying to add user. " + err)
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

app.get('/browseOffers', function(req, res){
  console.log("Attempting to get all offered Shareables");
  sqlQueries.getAllOfferedShareables(dbInfo, function(err, offeredShareables){
    if(err){
      throw new Error("Error trying to get all Offered Shareables. " + err);
    }
    res.json({shareables: offeredShareables})
  });
});

app.get('/browseRequests', function(req, res){
  console.log("Attempting to get all reqested Shareables");
  sqlQueries.getAllRequestedShareables(dbInfo, function(err, requestedShareables){
    if(err){
      throw new Error("Error trying to get all Requested Shareables. " + err);
    }
    res.json({shareables : requestedShareables})
  });
});

app.get('/requests', function(req,res) {

});

app.get('/offers', function(req, res) {
  console.log(req.query.username+"\n");
  console.log("Attempting to get all offered/requested_received_offer the user is involved with");
  sqlQueries.getUsersOffers(dbInfo, req.query.username, function(err, usersOffers){
    if(err) throw err;
    res.json({userOffers : usersOffers});
  });
});
var logo =
"  ___ _               __      ___                \n" +
" / __| |_  __ _ _ _ __\\ \\    / / |_  ___ _ _ ___ \n" +
" \\__ \\ ' \\/ _` | '_/ -_) \\/\\/ /| ' \\/ -_) '_/ -_)\n" +
" |___/_||_\\__,_|_| \\___|\\_/\\_/ |_||_\\___|_| \\___|";

console.log(logo);

app.listen(portNumber);
console.log('ShareWhere server started on port ' + portNumber);
