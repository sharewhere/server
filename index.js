var express = require('express');
var app = express();
var router = express.Router();

/* GET home page. */
app.get('/', function(req, res){
  res.send('hello world');
});

app.listen(80);