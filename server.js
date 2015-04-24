var express = require('express')
  , hash = require('./pass').hash;
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var session = require('express-session')
var mysql = require('mysql');
var sqlQueries = require('./sql_queries');
var util = require('./util');
var log = require('./log');
var fs = require('fs');
var multer  = require('multer')
var SessionStore = require('express-mysql-session')

var app = express();

var debugHangup = false;

//sql connection info
var dbInfo = {
  host     : 'localhost',
  user     : 'ShareWhereUser',
  password : 'N3onIc3d',
  database : 'ShareWhereTest',
  dateStrings : true
}

var sessionStore = new SessionStore(dbInfo)

// ###############################
// # Middleware
// ###############################
app.use(cookieParser('shhhh, very secret'));
app.use(function(req,res,next){
    if(debugHangup){
        log.info("cookie parser finished");
    }
    next();
});

// 7 days until cookie expiration
app.use(session({
    secret: 'shhhh, very secret',
    store: sessionStore,
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 604800000 }
}));
app.use(function(req,res,next){
    if(debugHangup){
        log.info("session() finished");
    }
    next();
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(function(req,res,next){
    if(debugHangup){
        log.info("bodyparser finished");
    }
    next();
});

// Endpoint logging and generic errors
app.use(function(req, res, next){
  var err = req.session.error
    , msg = req.session.success;
  delete req.session.error;
  delete req.session.success;
  res.locals.message = '';
  if (err) res.locals.message = '<p class="msg error">' + err + '</p>';
  if (msg) res.locals.message = '<p class="msg success">' + msg + '</p>';

  // IP and endpoint logging
  log.endpoint(req.ip, req.method, req.url);

  next();
});

app.use('/images', express.static('images'));

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
    log.fail("Access denied due to not being logged in");
    req.session.error = 'Access denied!';
    res.json({error_message: "Access denied!", cookieValid : false});
    return;
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
   log.info(req.session.user);
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

//The username is stored in the session. It is accessible by res.session.user.username
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
        req.session.success = 'Authenticated as ' + user.username
          + ' click to <a href="/logout">logout</a>. '
          + ' You may now access <a href="/restricted">/restricted</a>.';
        res.json({success : 'true' })

        log.success("Auth success for '%s'", user.username);
      });
    } else {
      req.session.error = 'Authentication failed, please check your '
        + ' username and password.';
      res.json({success : 'false'})

      log.fail("Auth failed for %s. %s", req.body.username, err);
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
    log.info("Attempting to add user: " + user.username)
    sqlQueries.addUser(dbInfo, user, function(err, rows, fields){
        if(err){
            log.fail("Error trying to add user. " + err)
            res.json({success: 'false', errorMessage: 'User already exists'});
            return;
        }
        req.session.regenerate(function(){
            req.session.user = user
            req.session.success = 'Authenticated as ' + user.username
            + ' click to <a href="/logout">logout</a>. '
            + ' You may now access <a href="/restricted">/restricted</a>.';
            log.success("New user '%s'. Welcome!", user.username)
            res.json({success: 'true'})
            });

    });

});

app.get('/browseoffers', restrict, function(req, res){
    log.info("Attempting to get all offered Shareables");
    sqlQueries.getAllOfferedShareables(dbInfo, function(err, offeredShareables){
        if(err){
            log.error(err);
            res.json({success : false, error_message : "error in browseoffers : "+err})
        }
        res.json({success : true, offers : offeredShareables})
    });
});

app.get('/browserequests', restrict, function(req, res){
    log.info("Attempting to get all reqested Shareables");
    sqlQueries.getAllRequestedShareables(dbInfo, function(err, requestedShareables){
        if(err){
            log.error(err);
            res.json({success : false, error_message : ("error in browserequests : "+err)});
        }
        res.json({success : true, requests : requestedShareables})
    });
});

app.get('/requests', restrict, function(req,res) {
    log.info("Attempting to get all offer type shareables the user is involved with");
    sqlQueries.getUsersRequests(dbInfo, req.session.user.username, function(err, usersRequests){
        if(err) {
            log.error(err);
            res.json({success : false, error_message : "error in requests : "+err})
        }
        res.json({success: true, requests : usersRequests});
    });
});

app.get('/offers', restrict, function(req, res) {
    log.info("Attempting to get all offer type shareables the user is involved with");
    sqlQueries.getUsersOffers(dbInfo, req.session.user.username, function(err, usersOffers){
        if(err) {
            log.error(err);
            res.json({success : false, error_message : "error in offers : "+err})
        }
        res.json({success: true, offers : usersOffers});
    });
});

app.get('/viewreqoffshareable', restrict, function(req, res) {
    if(!req.query.shar_id) {
        res.json({
            success : false,
            error_message : "shar_id not set."
        })
        return;
    }
    sqlQueries.apiGetReqOffShareable(dbInfo, req.query.shar_id, req.session.user.username, function(err, shrble, trnsction) {
        if(err) {
            res.json({
                success : false,
                error_message : "Error getting the shareable info in apiGetReqOffShareable: "+err
            })
            return;
        }
        if(shrble.username == req.session.user.username) {
            if(trnsction.length <1) {
                res.json({success: true, shareable : shrble, transactions : null});
                return;
            }
            else{
                res.json({success: true, shareable : shrble, transactions : trnsction});
                return;
            }
        }
        else {
            if(trnsction.length <1) {
                res.json({success: true, shareable : shrble, transaction : null});
                return;
            }
            else{
                res.json({success: true, shareable : shrble, transaction : trnsction[0]});
                return;
            }
        }
    });
});

app.post('/makeshareablerequest', multer({ dest: __dirname+'/images/'}), restrict, function(req, res) {
    //
    // debug code
    log.info('Attempting to make a shareable request.');
    //
    if(!req.body.shar_name) {
        res.json({
            success : false,
            error_message : "shar_name not set."
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
    var shareableStartDate
    if(!req.body.start_date){
        shareableStartDate = null
    }
    else{
        shareableStartDate = req.body.start_date;
    }
    var shareableEndDate
    if(!req.body.end_date){
        shareableEndDate = null
    }
    else{
        shareableEndDate = req.body.end_date;
    }
    
    var sharPicName;
    if(!req.files.picture){
        sharPicName = null;
    }
    else {
       sharPicName = req.files.picture.name;
    }
    
    shareable = {
        shar_name: req.body.shar_name,
        state_name: "requesting",
        description: shareableDescription,
        shar_pic_name: sharPicName,
        start_date: shareableStartDate,
        end_date: shareableEndDate
    };
    uploadingUser = {
        username: req.session.user.username
    };
    sqlQueries.apiAddShareable(dbInfo, shareable, uploadingUser,  function(err, shareable, fields){
        if(err){
            res.json({
                success : false,
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

app.post('/makeshareableoffer', multer({ dest: __dirname+'/images/'}), restrict, function(req, res) {
    if(!req.body.shar_name) {
        log.fail("shar_name wasn't set")
        res.json({
            success : false,
            error_message : "shar_name not set."
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
    var shareableStartDate
    if(!req.body.start_date){
        shareableStartDate = null
    }
    else{
        shareableStartDate = req.body.start_date;
    }
    var shareableEndDate
    if(!req.body.end_date){
        shareableEndDate = null
    }
    else{
        shareableEndDate = req.body.end_date;
    }
    
    var sharPicName;
    if(!req.files.picture){
        sharPicName = null;
    }
    else {
       sharPicName = req.files.picture.name;
    }
    
    shareable = {
        shar_name: req.body.shar_name,
        state_name: "offering",
        description: shareableDescription,
        shar_pic_name: sharPicName,
        start_date: shareableStartDate,
        end_date: shareableEndDate
        
    };
    uploadingUser = {
        username: req.session.user.username
    };
    sqlQueries.apiAddShareable(dbInfo, shareable, uploadingUser,  function(err, shareable, fields){
        if(err){
            log.error("Failed to create the shareable: " + err);
            res.json({
                success : false,
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

app.get('/searchoffers', restrict, function(req, res){
  
  if(!req.query.searchValue) {
    res.json({
      success : false,
      error_message : "searchValue not set in /search. searchValue is the name of the shareables you are trying to retrieve."
    })
    return;
  }
  
  sqlQueries.getSearchedOffers(dbInfo, req.query.searchValue, function(err, shareables){
    if(err) {
      res.json({
        success : false,
        error_message : err
      })
      return;
    }
    res.json({
      success : true,
      searchedShareables : shareables
    })
  });

});

app.get('/searchrequests', restrict, function(req, res){
  
  if(!req.query.searchValue) {
    res.json({
      success : false,
      error_message : "searchValue not set in /search. searchValue is the name of the shareables you are trying to retrieve."
    })
    return;
  }
  
  sqlQueries.getSearchedRequests(dbInfo, req.query.searchValue, function(err, shareables){
    if(err) {
      res.json({
        success : false,
        error_message : err
      })
      return;
    }
    res.json({
      success : true,
      searchedShareables : shareables
    })
  });

});

app.post('/completeshareable', restrict, function(req, res){
  if(!req.body.transID){
    res.json({
      success : false,
      error_message : "transID not set in /completeshareable. transID is the transaction ID of the transaction you are trying to complete."
    })
    return;
  }

	sqlQueries.completeShareable(dbInfo, req.body.transID, function(err){
	  if(err) {
            log.fail("could not complete: " + err);
		  res.json({
			success : false,
			error_message : err
		  })
		  return;
	  }
            log.success("shareable transaction %d completed", req.body.transID);
	  res.json({
		success : true
	  })

  });
});

app.post('/offeronrequest', restrict, function(req, res){
    if(!req.body.shar_id){
        res.json({
           success : false,
           error_message : "shar_id not set in route offeronrequest. shar_id must be the shareable that is being requested."
        });
        return;
    }
    
    sqlQueries.offerOnRequest(dbInfo, req.body.shar_id, req.session.user.username, function(err, rows, fields){
        if(err) {
            res.json({
                success : false,
                error_message : err
            })
            return;
        }
        res.json({
            success : true
        })
        return;
    })
});

app.post('/requestonoffer', restrict, function(req, res){
    if(!req.body.shar_id){
        res.json({
           success : false,
           error_message : "shar_id not set in route requestonoffer. shar_id must be the shareable that is being offered."
        });
        return;
    }
    
    sqlQueries.requestOnOffer(dbInfo, req.body.shar_id, req.session.user.username, function(err, rows, fields){
        if(err) {

        log.fail("%s failed to request offered shareable %d",
          req.session.user.username,
          req.body.shar_id);

            res.json({
                success : false,
                error_message : err
            })
            return;
        }
        log.success("%s successfully requested offered shareable %d",
          req.session.user.username,
          req.body.shar_id);

        res.json({
            success : true
        })
        return;
    })
});

// ###############################
// # Startup
// ###############################
util.printLogo()

var portNumber = util.getSuitablePort();
app.listen(portNumber);
log.notice('ShareWhere server started on port ' + portNumber);
