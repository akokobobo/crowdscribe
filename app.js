
/**
 * Module dependencies.
 */

var express = require('express');
var redisModule = require('redis');
var redis = redisModule.createClient();
redis.select(1);

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', function(req, res){
  res.render('index', {
    title: 'Express'
  });
});

/**
 * Register user and log them in automatically
 * @param {String} username
 * @param {String} password
 * @returns {JSON} { error: 'Username/Password no good, username Already taken' } || {result: 'success', token: '2121ffg'}
 */
app.post('/signup', function(req, res) {
  
});

/**
 * Logs in a user.
 * @param {String} username
 * @param {String} password
 * @returns {JSON} { error: 'Username and Password combo no good' } || {result: 'success', token: '2121ffg'}
 */
app.post('/singin', function(req, res) {
  
});

/**
 * AUTH REQUIRED
 * Returns all active stories
 * @returns {result: [story]}
 */
app.get('/stories', function(req, res) {
});



app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
