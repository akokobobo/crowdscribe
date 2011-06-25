
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
  app.set('view engine', 'mustache');
	app.register('.mustache', require('stache'));
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
		locals: {
			title: 'Express'
		}
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
 * @param {Array} fields of story to be returned. ID is passed by default
 * @returns {result: [story]}
 */
app.get('/stories', function(req, res) {
  
});

/**
 * Creates a story
 * @param {String} message The first post body message
 * @param {Number} maxPlayers, the maximum ammount of players that may join
 * @param {String} name, optional story name
 * @returns {Number} the story id created.
 */
app.get('/story/create', function(req, res) {
  
});

/**
 * Returns a story object by id
 * @param {Array} fields of story to be returned. ID is passed by default
 */
app.get('/story/:id', function(req, res) {
  
});

/**
 * Returns all users playing on a story
 * @param {Array} fields needed of user. ID is passed by default
 */
app.get('/story/:id/users', function(req, res) {
  
});

/**
 * Returns all current posts that might be penting for votes
 */
app.get('/story/:id/posts', function(req, res) {
  
});

/**
 * Returns the story stream that has been submitted so far.
 */
app.get('/story/:id/stream', function(req, res) {
  
});

/**
 * Submits a post
 * @param {String} The post body message
 */
app.post('/story/:id/post', function(req, res) {
  
});

/**
 * Submits a vote on a post
 * @param {Number} Post ID
 */
app.post('/story/:id/vote', function(req, res) {
  
});


app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
